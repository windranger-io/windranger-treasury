// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "../RoleAccessControl.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

import "./StakingPoolLib.sol";

import "hardhat/console.sol";

contract StakingPool is Initializable, RoleAccessControl, ReentrancyGuard {
    struct User {
        uint128 depositAmount;
        uint128[] rewardAmounts;
    }

    mapping(address => User) internal _users;

    StakingPoolLib.Data internal _stakingPoolInfo;

    event WithdrawRewards(
        address indexed user,
        address rewardToken,
        uint256 rewards
    );

    event Withdraw(address indexed user, uint256 stake);

    event WithdrawWithoutRewards(address indexed user, uint256 stake);

    event Deposit(address indexed user, uint256 depositAmount);

    event RewardsInitialized(address rewardTokens, uint256 amount);

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

    function deposit(uint256 amount)
        external
        stakingPeriodNotStarted
        nonReentrant
        stakingPoolNotFull(amount)
    {
        console.log("depositing..!");
        require(
            amount >= _stakingPoolInfo.minimumContribution,
            "StakingPool: min contribution"
        );

        User storage user = _users[_msgSender()];

        user.depositAmount += uint128(amount);
        _stakingPoolInfo.totalStakedAmount += uint128(amount);

        StakingPoolLib.StakingPoolType poolType = _stakingPoolInfo.poolType;

        for (uint256 i = 0; i < _stakingPoolInfo.rewardTokens.length; i++) {
            uint256 rewardsPerShare = 0;
            if (poolType == StakingPoolLib.StakingPoolType.FLOATING) {
                _computeRewardsPerShare(i);
                _stakingPoolInfo.rewardTokens[i].rewardAmountRatio = uint32(
                    rewardsPerShare
                );
            } else {
                // fixed
                user.rewardAmounts[i] += _computeRewards(uint128(amount), i);
            }

            // assign storage for rewards amount
            user.rewardAmounts.push(0);
        }

        emit Deposit(_msgSender(), amount);

        require(
            _stakingPoolInfo.stakeToken.transferFrom(
                _msgSender(),
                address(this),
                amount
            ),
            "StakingPool: failed to transfer"
        );
    }

    function withdraw()
        external
        stakingPeriodComplete
        rewardsAvailable
        nonReentrant
    {
        User memory user = _users[_msgSender()];

        console.log("user.depositAmount ", user.depositAmount);

        require(user.depositAmount > 0, "StakingPool: not eligible");

        delete _users[_msgSender()];
        emit Withdraw(_msgSender(), user.depositAmount);
        require(
            _stakingPoolInfo.stakeToken.transfer(
                _msgSender(),
                uint256(user.depositAmount)
            ),
            "StakingPool: stake tx fail"
        );

        StakingPoolLib.StakingPoolType poolType = _stakingPoolInfo.poolType;

        for (uint256 i = 0; i < _stakingPoolInfo.rewardTokens.length; i++) {
            uint256 amount = 0;

            // floating
            if (poolType == StakingPoolLib.StakingPoolType.FLOATING) {
                amount = uint256(
                    _stakingPoolInfo.rewardTokens[i].rewardAmountRatio *
                        user.depositAmount
                );
            } else {
                // fixed
                amount = uint256(user.rewardAmounts[i]);
            }

            IERC20 token = IERC20(_stakingPoolInfo.rewardTokens[i].token);

            emit WithdrawRewards(_msgSender(), address(token), amount);

            require(
                token.transfer(_msgSender(), amount),
                "FixedStaking: reward tx fail"
            );
        }
    }

    // withdraw stake separately from rewards (rewards may not be available yet)
    function withdrawStake() external stakingPeriodComplete nonReentrant {
        console.log("StakingPool: withdrawStake() for ", _msgSender());

        User storage user = _users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        uint128 currentDepositBalance = user.depositAmount;
        emit Withdraw(_msgSender(), user.depositAmount);
        user.depositAmount = 0;

        console.log("transferring..", address(_stakingPoolInfo.stakeToken));

        require(
            _stakingPoolInfo.stakeToken.transfer(
                _msgSender(),
                uint256(user.depositAmount)
            ),
            "StakingPool: stake tx fail"
        );

        // calc the amount of rewards the user is due
        for (uint256 i = 0; i < _stakingPoolInfo.rewardTokens.length; i++) {
            user.rewardAmounts[i] = uint128(
                _stakingPoolInfo.rewardTokens[i].rewardAmountRatio *
                    currentDepositBalance
            );
        }
    }

    // to be called after withdrawStake()
    function withdrawRewards() external stakingPeriodComplete rewardsAvailable {
        console.log("withdrawing rewards");

        User memory user = _users[_msgSender()];
        require(user.rewardAmounts.length > 0, "StakingPool: No rewards");
        delete _users[_msgSender()];

        StakingPoolLib.RewardToken[] memory rewardTokens = _stakingPoolInfo
            .rewardTokens;

        for (uint256 i = 0; i < rewardTokens.length; i++) {
            IERC20 token = IERC20(rewardTokens[i].token);
            require(
                token.transfer(
                    _msgSender(),
                    user.rewardAmounts[i] // is this the same for floating and fixed?
                ),
                "StakingPool: rewards tx failed"
            );
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

        uint256 now = block.timestamp;

        require(info.epochStartTimestamp >= now, "StakingPool: start time");
        require(
            address(info.stakeToken) != address(0),
            "StakingPool: stake token defined"
        );
        require(
            info.rewardsAvailableTimestamp >
                info.epochStartTimestamp + info.epochDuration,
            "StakingPool: init rewards"
        );
        require(info.treasury != address(0), "StakePool: nonzero treasury"); // TODO: are we checking if the treasury is whitelisted to that daoId
        require(info.emergencyMode != true, "StakePool: init emergency mode");

        require(info.maxTotalPoolStake > 0, "StakePool: maxTotalPoolStake > 0"); // is this check pointless?
        require(info.epochDuration > 0, "StakePool: epochDuration > 0"); // is this check pointless?
        require(info.minimumContribution > 0, "StakePool: minimumContribution"); // is this check pointless?
        require(info.totalStakedAmount == 0, "StakePool: totalStakedAmount"); // or should we move this to be a single field?

        _stakingPoolInfo = info;
    }

    function emergencyWithdraw() external emergencyModeEnabled {
        _withdrawWithoutRewards();
    }

    function initializeRewardTokens(
        address treasury,
        StakingPoolLib.RewardToken[] calldata rewardTokens
    ) external atLeastDaoMeepleRole(_stakingPoolInfo.daoId) {
        _initializeRewardTokens(treasury, rewardTokens);
    }

    function adminEmergencyRewardSweep()
        external
        atLeastDaoAminRole(_stakingPoolInfo.daoId)
        emergencyModeEnabled
    {
        _adminEmergencyRewardSweep();
    }

    function enableEmergencyMode()
        external
        atLeastDaoAminRole(_stakingPoolInfo.daoId)
    {
        _stakingPoolInfo.emergencyMode = true;
    }

    function computeRewardsPerShare(uint256 rewardTokenIndex)
        external
        view
        returns (uint256)
    {
        return _computeRewardsPerShare(rewardTokenIndex);
    }

    function currentExpectedReward(address user)
        external
        view
        returns (uint256[] memory)
    {
        User memory _user = _users[user];
        StakingPoolLib.Data memory _stakingPoolInfo = _stakingPoolInfo;
        uint256[] memory rewards = new uint256[](
            _stakingPoolInfo.rewardTokens.length
        );

        for (uint256 i = 0; i < _stakingPoolInfo.rewardTokens.length; i++) {
            rewards[i] = uint256(
                (_stakingPoolInfo.rewardTokens[i].rewardAmountRatio *
                    _user.depositAmount) / 1 ether
            );
        }
        return rewards;
    }

    //fixed
    function computeRewards(address recipient, uint256 rewardTokenIndex)
        external
        view
        returns (uint128)
    {
        return
            _computeRewards(_users[recipient].depositAmount, rewardTokenIndex);
    }

    function isRedeemable() external view returns (bool) {
        return _isRewardsAvailable() && _isStakingPeriodComplete();
    }

    function isRewardsFinalized() external view returns (bool) {
        return _isRewardsAvailable();
    }

    function _initializeRewardTokens(
        address treasury,
        StakingPoolLib.RewardToken[] calldata _rewardTokens
    ) internal {
        for (uint256 i = 0; i < _rewardTokens.length; i++) {
            IERC20 token = IERC20(_rewardTokens[i].token);

            emit RewardsInitialized(
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
        _transferStake(uint256((user.depositAmount)));
    }

    function _setRewardsAvailableTimestamp(uint32 timestamp) internal {
        require(!_isStakingPeriodComplete(), "StakePool: already finalized");
        _stakingPoolInfo.rewardsAvailableTimestamp = timestamp;
        emit RewardsAvailableTimestamp(timestamp);
    }

    function _transferStake(uint256 amount) internal {
        emit WithdrawWithoutRewards(_msgSender(), amount);
        require(
            _stakingPoolInfo.stakeToken.transfer(msg.sender, amount),
            "StakingPool: stake tx fail"
        );
    }

    function _adminEmergencyRewardSweep() internal {
        StakingPoolLib.RewardToken[] memory rewardTokens = _stakingPoolInfo
            .rewardTokens;
        address treasury = _stakingPoolInfo.treasury;

        for (uint256 i = 0; i < rewardTokens.length; i++) {
            IERC20 token = IERC20(rewardTokens[i].token);
            require(
                token.transfer(
                    treasury,
                    rewardTokens[i].totalTokenRewardsAvailable
                ),
                "StakingPool: withdraw tx failed"
            );
        }
    }

    // fixed
    function _computeRewards(uint128 amount, uint256 rewardTokenIndex)
        internal
        view
        returns (uint128)
    {
        return
            uint128(
                (amount *
                    _stakingPoolInfo
                        .rewardTokens[rewardTokenIndex]
                        .rewardAmountRatio) / 1 ether
            );
    }

    //floating
    function _computeRewardsPerShare(uint256 rewardTokenIndex)
        internal
        view
        returns (uint256)
    {
        StakingPoolLib.Data memory _stakingPoolInfo = _stakingPoolInfo;

        uint256 availableTokenRewards = _stakingPoolInfo
            .rewardTokens[rewardTokenIndex]
            .totalTokenRewardsAvailable;

        return availableTokenRewards / _stakingPoolInfo.totalStakedAmount;
    }

    function _isRewardsAvailable() internal view returns (bool) {
        return block.timestamp >= _stakingPoolInfo.rewardsAvailableTimestamp;
    }

    function _isStakingPeriodComplete() internal view returns (bool) {
        return
            block.timestamp >=
            (_stakingPoolInfo.epochStartTimestamp +
                _stakingPoolInfo.epochDuration);
    }
}
