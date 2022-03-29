// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "../RoleAccessControl.sol";
import "./StakingPoolLib.sol";

contract StakingPool is
    Initializable,
    RoleAccessControl,
    ReentrancyGuard,
    PausableUpgradeable
{
    struct User {
        uint128 depositAmount;
        uint128[5] rewardAmounts;
    }

    mapping(address => User) private _users;

    StakingPoolLib.Data private _stakingPoolInfo;

    event WithdrawRewards(
        address indexed user,
        address rewardToken,
        uint256 rewards
    );

    event WithdrawStake(address indexed user, uint256 stake);

    event Deposit(address indexed user, uint256 depositAmount);

    event InitializeRewards(address rewardTokens, uint256 amount);

    event RewardsAvailableTimestamp(uint32 rewardsAvailableTimestamp);

    modifier rewardsAvailable() {
        require(_isRewardsAvailable(), "StakingPool: rewards too early");
        _;
    }

    modifier stakingPeriodComplete() {
        require(_isStakingPeriodComplete(), "StakingPool: still stake period");
        _;
    }

    modifier stakingPoolRequirementsUnmet() {
        //slither-disable-next-line timestamp
        require(
            (_stakingPoolInfo.totalStakedAmount <
                _stakingPoolInfo.minTotalPoolStake) &&
                (block.timestamp > _stakingPoolInfo.epochStartTimestamp),
            "StakingPool: requirements unmet"
        );
        _;
    }

    modifier emergencyModeEnabled() {
        require(
            _stakingPoolInfo.emergencyMode,
            "StakingPool: not emergency mode"
        );
        _;
    }

    modifier stakingPeriodNotStarted() {
        //slither-disable-next-line timestamp
        require(
            block.timestamp >= _stakingPoolInfo.epochStartTimestamp,
            "StakingPool: too early"
        );
        _;
    }

    modifier stakingPoolNotFull(uint256 _deposit) {
        require(
            _stakingPoolInfo.totalStakedAmount + _deposit <
                _stakingPoolInfo.maxTotalPoolStake,
            "StakingPool: pool full"
        );
        _;
    }

    function pause()
        external
        whenNotPaused
        atLeastDaoMeepleRole(_stakingPoolInfo.daoId)
    {
        _pause();
    }

    function unpause()
        external
        whenPaused
        atLeastDaoMeepleRole(_stakingPoolInfo.daoId)
    {
        _unpause();
    }

    /**
     * @notice Only entry point for a user to deposit into the staking pool
     *
     * @param amount Amount of stake tokens to deposit
     */
    function deposit(uint256 amount)
        external
        whenNotPaused
        stakingPeriodNotStarted
        nonReentrant
        stakingPoolNotFull(amount)
    {
        require(
            amount >= _stakingPoolInfo.minimumContribution,
            "StakingPool: min contribution"
        );

        User storage user = _users[_msgSender()];
        StakingPoolLib.Data storage _info = _stakingPoolInfo;

        user.depositAmount += uint128(amount);
        _info.totalStakedAmount += uint128(amount);

        // calculate/update rewards
        for (uint256 i = 0; i < _info.rewardTokens.length; i++) {
            if (_info.poolType == StakingPoolLib.StakingPoolType.FLOATING) {
                // floating: update the global rewards ratio
                _info.rewardTokens[i].rewardAmountRatio = uint32(
                    _computeFloatingRewardsPerShare(i)
                );
            } else {
                // fixed: set the reward amount per user now
                user.rewardAmounts[i] += _computeFixedRewards(
                    uint128(amount),
                    i
                );
            }
        }

        emit Deposit(_msgSender(), amount);

        require(
            _info.stakeToken.transferFrom(_msgSender(), address(this), amount),
            "StakingPool: failed to transfer"
        );
    }

    /**
     * @notice Withdraw both stake and reward tokens when the stake period is complete
     */
    function withdraw()
        external
        stakingPeriodComplete
        rewardsAvailable
        nonReentrant
    {
        User memory user = _users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        delete _users[_msgSender()];

        StakingPoolLib.Data storage _info = _stakingPoolInfo;

        //slither-disable-next-line reentrancy-events
        _transferStake(user.depositAmount, IERC20(_info.stakeToken));

        // calculate the rewardAmounts due to the user
        for (uint256 i = 0; i < _info.rewardTokens.length; i++) {
            uint256 amount = 0;

            // floating
            if (_info.poolType == StakingPoolLib.StakingPoolType.FLOATING) {
                amount = uint256(
                    _stakingPoolInfo.rewardTokens[i].rewardAmountRatio *
                        user.depositAmount
                );
            } else {
                // fixed
                amount = uint256(user.rewardAmounts[i]);
            }
            //slither-disable-next-line calls-loop
            _transferRewards(amount, IERC20(_info.rewardTokens[i].token));
        }
    }

    /**
     * @notice Withdraw only stake tokens. Reward tokens may not be available/unlocked yet.
     */
    function withdrawStake() external stakingPeriodComplete nonReentrant {
        User storage user = _users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        uint128 currentDepositBalance = user.depositAmount;
        user.depositAmount = 0;

        StakingPoolLib.Data storage _info = _stakingPoolInfo;

        // calculate the amount of rewards the user is due for the floating pool type
        // fixed amounts are calculated on deposit.
        for (uint256 i = 0; i < _info.rewardTokens.length; i++) {
            if (_info.poolType == StakingPoolLib.StakingPoolType.FLOATING) {
                user.rewardAmounts[i] = uint128(
                    _computeFloatingRewardsPerShare(i) * currentDepositBalance
                );
            }
        }

        _transferStake(currentDepositBalance, IERC20(_info.stakeToken));
    }

    /**
     * @notice Withdraw only reward tokens. Stake may have already been withdrawn.
     */
    function withdrawRewards() external stakingPeriodComplete rewardsAvailable {
        User memory user = _users[_msgSender()];
        require(user.rewardAmounts[0] > 0, "StakingPool: No rewards"); // this is safe?

        delete _users[_msgSender()];

        StakingPoolLib.RewardToken[] memory rewards = _stakingPoolInfo
            .rewardTokens;

        for (uint256 i = 0; i < rewards.length; i++) {
            //slither-disable-next-line calls-loop
            _transferRewards(user.rewardAmounts[i], IERC20(rewards[i].token));
        }
    }

    // withdraw when the pool is not going ahead (earlyWithdraw)
    function withdrawWithoutRewards() external stakingPoolRequirementsUnmet {
        _withdrawWithoutRewards();
    }

    function initialize(StakingPoolLib.Data calldata info)
        external
        virtual
        initializer
    {
        __RoleAccessControl_init();
        __Context_init_unchained();
        __Pausable_init();

        //slither-disable-next-line timestamp
        require(
            info.epochStartTimestamp >= block.timestamp,
            "StakingPool: start time"
        );

        // todo should we check if stakeToken != any of the reward tokens?
        require(
            address(info.stakeToken) != address(0),
            "StakingPool: stake token defined"
        );
        //slither-disable-next-line timestamp
        require(
            info.rewardsAvailableTimestamp >
                info.epochStartTimestamp + info.epochDuration,
            "StakingPool: init rewards"
        );
        require(info.treasury != address(0), "StakePool: nonzero treasury"); // TODO: are we checking if the treasury is whitelisted to that daoId
        require(!info.emergencyMode, "StakePool: init emergency mode");

        require(info.maxTotalPoolStake > 0, "StakePool: maxTotalPoolStake > 0"); // is this check pointless?
        require(info.epochDuration > 0, "StakePool: epochDuration > 0"); // is this check pointless?
        require(info.minimumContribution > 0, "StakePool: minimumContribution"); // is this check pointless?
        require(info.totalStakedAmount == 0, "StakePool: totalStakedAmount"); // or should we move this to be a single field?

        if (info.launchPaused) {
            _pause();
        }

        _stakingPoolInfo = info;
    }

    function emergencyWithdraw() external emergencyModeEnabled {
        _withdrawWithoutRewards();
    }

    function initializeRewardTokens(
        address treasury,
        StakingPoolLib.RewardToken[] calldata rewards
    ) external atLeastDaoMeepleRole(_stakingPoolInfo.daoId) {
        _initializeRewardTokens(treasury, rewards);
    }

    function adminEmergencyRewardSweep()
        external
        atLeastDaoAdminRole(_stakingPoolInfo.daoId)
        emergencyModeEnabled
    {
        _adminEmergencyRewardSweep();
    }

    function enableEmergencyMode()
        external
        atLeastDaoAdminRole(_stakingPoolInfo.daoId)
    {
        _stakingPoolInfo.emergencyMode = true;
    }

    function setRewardsAvailableTimestamp(uint32 timestamp)
        external
        atLeastDaoAdminRole(_stakingPoolInfo.daoId)
    {
        _setRewardsAvailableTimestamp(timestamp);
    }

    function computeFloatingRewardsPerShare(uint256 rewardTokenIndex)
        external
        view
        returns (uint256)
    {
        return _computeFloatingRewardsPerShare(rewardTokenIndex);
    }

    function currentExpectedReward(address user)
        external
        view
        returns (uint256[] memory)
    {
        User memory _user = _users[user];
        StakingPoolLib.Data memory _info = _stakingPoolInfo;

        uint256[] memory rewards = new uint256[](_info.rewardTokens.length);

        for (uint256 i = 0; i < _info.rewardTokens.length; i++) {
            if (_info.poolType == StakingPoolLib.StakingPoolType.FLOATING) {
                rewards[i] = uint256(
                    (_info.rewardTokens[i].rewardAmountRatio *
                        _user.depositAmount) / 1 ether
                );
            } else {
                rewards[i] = _computeFixedRewards(_user.depositAmount, i);
            }
        }
        return rewards;
    }

    function computeFixedRewards(address recipient, uint256 rewardTokenIndex)
        external
        view
        returns (uint128)
    {
        return
            _computeFixedRewards(
                _users[recipient].depositAmount,
                rewardTokenIndex
            );
    }

    function isRedeemable() external view returns (bool) {
        //slither-disable-next-line timestamp
        return _isRewardsAvailable() && _isStakingPeriodComplete();
    }

    function isRewardsFinalized() external view returns (bool) {
        return _isRewardsAvailable();
    }

    function isStakingPeriodComplete() external view returns (bool) {
        return _isStakingPeriodComplete();
    }

    function _initializeRewardTokens(
        address treasury,
        StakingPoolLib.RewardToken[] calldata _rewardTokens
    ) internal {
        for (uint256 i = 0; i < _rewardTokens.length; i++) {
            IERC20 token = IERC20(_rewardTokens[i].token);

            emit InitializeRewards(
                address(token),
                _rewardTokens[i].totalTokenRewardsAvailable
            );

            require(
                token.allowance(treasury, address(this)) >=
                    _rewardTokens[i].totalTokenRewardsAvailable,
                "StakingPool: invalid allowance"
            );

            require(
                token.transferFrom(
                    treasury,
                    address(this),
                    _rewardTokens[i].totalTokenRewardsAvailable
                ),
                "StakingPool: fund tx failed"
            );
        }
    }

    function _withdrawWithoutRewards() internal {
        User memory user = _users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        delete _users[_msgSender()];
        StakingPoolLib.Data memory _info = _stakingPoolInfo;
        _transferStake(uint256((user.depositAmount)), IERC20(_info.stakeToken));
    }

    function _setRewardsAvailableTimestamp(uint32 timestamp) internal {
        require(!_isStakingPeriodComplete(), "StakePool: already finalized");
        //slither-disable-next-line timestamp
        require(timestamp > block.timestamp, "StakePool: future rewards");

        _stakingPoolInfo.rewardsAvailableTimestamp = timestamp;
        emit RewardsAvailableTimestamp(timestamp);
    }

    function _transferStake(uint256 amount, IERC20 stakeToken) internal {
        emit WithdrawStake(_msgSender(), amount);
        require(
            stakeToken.transfer(msg.sender, amount),
            "StakingPool: stake tx fail"
        );
    }

    function _transferRewards(uint256 amount, IERC20 rewardsToken) internal {
        emit WithdrawRewards(_msgSender(), address(rewardsToken), amount);
        //slither-disable-next-line calls-loop
        require(
            rewardsToken.transfer(_msgSender(), amount),
            "StakingPool: rewards tx failed"
        );
    }

    function _adminEmergencyRewardSweep() internal {
        StakingPoolLib.RewardToken[] memory rewards = _stakingPoolInfo
            .rewardTokens;
        address treasury = _stakingPoolInfo.treasury;

        for (uint256 i = 0; i < rewards.length; i++) {
            IERC20 token = IERC20(rewards[i].token);
            require(
                token.transfer(treasury, rewards[i].totalTokenRewardsAvailable),
                "StakingPool: withdraw tx failed"
            );
        }
    }

    // fixed
    function _computeFixedRewards(uint128 amount, uint256 rewardTokenIndex)
        internal
        view
        returns (uint128)
    {
        return
            uint128(
                (amount *
                    _stakingPoolInfo
                        .rewardTokens[rewardTokenIndex]
                        .rewardAmountRatio)
            );
    }

    //floating
    function _computeFloatingRewardsPerShare(uint256 rewardTokenIndex)
        internal
        view
        returns (uint256)
    {
        StakingPoolLib.Data memory _info = _stakingPoolInfo;

        uint256 availableTokenRewards = _info
            .rewardTokens[rewardTokenIndex]
            .totalTokenRewardsAvailable;

        return availableTokenRewards / _info.totalStakedAmount;
    }

    function _isRewardsAvailable() internal view returns (bool) {
        //slither-disable-next-line timestamp
        return block.timestamp >= _stakingPoolInfo.rewardsAvailableTimestamp;
    }

    function _isStakingPeriodComplete() internal view returns (bool) {
        //slither-disable-next-line timestamp
        return
            block.timestamp >=
            (_stakingPoolInfo.epochStartTimestamp +
                _stakingPoolInfo.epochDuration);
    }
}
