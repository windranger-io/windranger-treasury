// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "../RoleAccessControl.sol";
import "./StakingPoolLib.sol";

contract StakingPool is
    RoleAccessControl,
    ReentrancyGuard,
    PausableUpgradeable
{
    struct User {
        uint128 depositAmount;
        uint128[5] rewardAmounts;
    }
    struct RewardDue {
        address token;
        uint128 amount;
    }

    mapping(address => User) private _users;

    uint32 private _rewardsAvailableTimestamp;
    bool private _emergencyMode;
    uint128 private _totalStakedAmount;

    StakingPoolLib.Config private _stakingPoolInfo;

    event WithdrawRewards(
        address indexed user,
        address rewardToken,
        uint256 rewards
    );
    event WithdrawStake(address indexed user, uint256 stake);
    event Deposit(address indexed user, uint256 depositAmount);
    event InitializeRewards(address rewardTokens, uint256 amount);
    event RewardsAvailableTimestamp(uint32 rewardsAvailableTimestamp);
    event EmergencyMode(address indexed admin);

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
            (_totalStakedAmount < _stakingPoolInfo.minTotalPoolStake) &&
                (block.timestamp > _stakingPoolInfo.epochStartTimestamp),
            "StakingPool: requirements unmet"
        );
        _;
    }

    modifier emergencyModeEnabled() {
        require(_emergencyMode, "StakingPool: not emergency mode");
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
    function deposit(uint256 amount) external whenNotPaused nonReentrant {
        StakingPoolLib.Config storage _info = _stakingPoolInfo;

        require(
            amount >= _info.minimumContribution,
            "StakingPool: min contribution"
        );
        require(
            _totalStakedAmount + amount < _info.maxTotalPoolStake,
            "StakingPool: pool full"
        );
        //slither-disable-next-line timestamp
        require(
            block.timestamp < _info.epochStartTimestamp,
            "StakingPool: too late"
        );

        User storage user = _users[_msgSender()];

        user.depositAmount += uint128(amount);
        _totalStakedAmount += uint128(amount);

        emit Deposit(_msgSender(), amount);

        // calculate/update rewards
        if (_info.rewardType == StakingPoolLib.RewardType.FLOATING) {
            _updateRewardsRatios(_info);
        }
        if (_info.rewardType == StakingPoolLib.RewardType.FIXED) {
            _calculateFixedRewards(_info, user, amount);
        }

        require(
            _info.stakeToken.transferFrom(_msgSender(), address(this), amount),
            "StakingPool: deposit tx fail"
        );
    }

    /**
     * @notice Withdraw both stake and reward tokens when the stake period is complete
     */
    function withdraw()
        external
        whenNotPaused
        stakingPeriodComplete
        rewardsAvailable
        nonReentrant
    {
        User memory user = _users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        delete _users[_msgSender()];

        StakingPoolLib.Config storage _info = _stakingPoolInfo;

        //slither-disable-next-line reentrancy-events
        _transferStake(user.depositAmount, IERC20(_info.stakeToken));

        // calculate the rewardAmounts due to the user
        for (uint256 i = 0; i < _info.rewardTokens.length; i++) {
            uint256 amount = 0;

            // floating
            if (_info.rewardType == StakingPoolLib.RewardType.FLOATING) {
                amount = _calculateFloatingReward(
                    _info.rewardTokens[i].ratio,
                    user.depositAmount
                );
            }
            if (_info.rewardType == StakingPoolLib.RewardType.FIXED) {
                amount = uint256(user.rewardAmounts[i]);
            }
            //slither-disable-next-line calls-loop
            _transferRewards(amount, IERC20(_info.rewardTokens[i].tokens)); // todo: add check for amount > 0?
        }
    }

    /**
     * @notice Withdraw only stake tokens after staking period is complete. Reward tokens may not be available yet.
     */
    function withdrawStake()
        external
        stakingPeriodComplete
        nonReentrant
        whenNotPaused
    {
        User storage user = _users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        uint128 currentDepositBalance = user.depositAmount;
        user.depositAmount = 0;

        StakingPoolLib.Config storage _info = _stakingPoolInfo;

        for (uint256 i = 0; i < _info.rewardTokens.length; i++) {
            if (_info.rewardType == StakingPoolLib.RewardType.FLOATING) {
                user.rewardAmounts[i] = _calculateFloatingReward(
                    _info.rewardTokens[i].ratio,
                    currentDepositBalance
                );
            }
        }

        _transferStake(currentDepositBalance, IERC20(_info.stakeToken));
    }

    /**
     * @notice Withdraw only reward tokens. Stake may have already been withdrawn.
     */
    function withdrawRewards()
        external
        stakingPeriodComplete
        rewardsAvailable
        whenNotPaused
    {
        StakingPoolLib.Config memory _info = _stakingPoolInfo;

        User memory user = _users[_msgSender()];
        delete _users[_msgSender()];

        for (uint256 i = 0; i < user.rewardAmounts.length; i++) {
            if (user.rewardAmounts[i] > 0) {
                //slither-disable-next-line calls-loop
                _transferRewards(
                    user.rewardAmounts[i],
                    IERC20(_info.rewardTokens[i].tokens)
                );
            }
        }
    }

    /**
     * @notice Withdraw stake tokens when minimum pool conditions to begin are not met
     */
    function withdrawWithoutRewards()
        external
        stakingPoolRequirementsUnmet
        whenNotPaused
    {
        _withdrawWithoutRewards();
    }

    function initialize(
        StakingPoolLib.Config calldata info,
        bool paused,
        uint32 rewardsTimestamp
    ) external virtual initializer {
        __RoleAccessControl_init();
        __Context_init_unchained();
        __Pausable_init();

        //slither-disable-next-line timestamp
        require(
            info.epochStartTimestamp >= block.timestamp,
            "StakingPool: start time"
        );

        _enforceUniqueRewardTokens(info.rewardTokens);
        require(
            address(info.stakeToken) != address(0),
            "StakingPool: stake token defined"
        );
        //slither-disable-next-line timestamp
        require(
            rewardsTimestamp > info.epochStartTimestamp + info.epochDuration,
            "StakingPool: init rewards"
        );
        require(info.treasury != address(0), "StakePool: nonzero treasury"); // TODO: are we checking if the treasury is whitelisted to that daoId
        require(info.maxTotalPoolStake > 0, "StakePool: maxTotalPoolStake > 0");
        require(info.epochDuration > 0, "StakePool: epochDuration > 0");
        require(info.minimumContribution > 0, "StakePool: minimumContribution");

        if (paused) {
            _pause();
        }

        _rewardsAvailableTimestamp = rewardsTimestamp;
        _stakingPoolInfo = info;
    }

    function emergencyWithdraw() external emergencyModeEnabled {
        _withdrawWithoutRewards();
    }

    function initializeRewardTokens(
        address benefactor,
        StakingPoolLib.Reward[] calldata rewards
    ) external atLeastDaoMeepleRole(_stakingPoolInfo.daoId) {
        _initializeRewardTokens(benefactor, rewards);
    }

    function enableEmergencyMode()
        external
        atLeastDaoAdminRole(_stakingPoolInfo.daoId)
    {
        _emergencyMode = true;
        emit EmergencyMode(_msgSender());

        _adminEmergencyRewardSweep();
    }

    function setRewardsAvailableTimestamp(uint32 timestamp)
        external
        atLeastDaoAdminRole(_stakingPoolInfo.daoId)
    {
        _setRewardsAvailableTimestamp(timestamp);
    }

    // /**
    //  * @notice Returns the final amount of reward due for a user
    //  *
    //  * @param user address to calculate rewards for
    //  */
    // function currentRewards(address user)
    //     public
    //     view
    //     returns (RewardDue[] memory)
    // {
    //     User memory _user = _users[user];
    //     StakingPoolLib.Config memory _info = _stakingPoolInfo;

    //     RewardDue[] memory rewards = new RewardDue[](_info.rewardTokens.length);

    //     for (uint256 i = 0; i < _info.rewardTokens.length; i++) {
    //         if (_info.rewardType == StakingPoolLib.RewardType.FLOATING) {
    //             rewards[i] = RewardDue({
    //                 amount: _calculateFloatingReward(
    //                     _info.rewardTokens[i].ratio,
    //                     _user.depositAmount
    //                 ),
    //                 token: _info.rewardTokens[i].tokens
    //             });
    //         }
    //         if (_info.rewardType == StakingPoolLib.RewardType.FIXED) {
    //             rewards[i] = RewardDue({
    //                 amount: _user.rewardAmounts[i],
    //                 token: _info.rewardTokens[i].tokens
    //             });
    //         }
    //     }
    //     return rewards;
    // }

    function currentExpectedReward(address user)
        external
        view
        returns (uint256[] memory)
    {
        User memory _user = _users[user];
        StakingPoolLib.Config memory _info = _stakingPoolInfo;

        uint256[] memory rewards = new uint256[](_info.rewardTokens.length);

        for (uint256 i = 0; i < _info.rewardTokens.length; i++) {
            if (_info.rewardType == StakingPoolLib.RewardType.FLOATING) {
                if (_user.depositAmount == 0) {
                    // user has already withdrawn stake
                    rewards[i] = _user.rewardAmounts[i];
                } else {
                    // user has not withdraw stake yet
                    rewards[i] = _calculateFloatingReward(
                        _info.rewardTokens[i].ratio,
                        _user.depositAmount
                    );
                }
            }
            if (_info.rewardType == StakingPoolLib.RewardType.FIXED) {
                rewards[i] = _user.rewardAmounts[i];
            }
        }
        return rewards;
    }

    function stakingPoolData()
        external
        view
        returns (StakingPoolLib.Config memory)
    {
        return _stakingPoolInfo;
    }

    function rewardsAvailableTimestamp() external view returns (uint32) {
        return _rewardsAvailableTimestamp;
    }

    function emergencyMode() external view returns (bool) {
        return _emergencyMode;
    }

    function totalStakedAmount() external view returns (uint128) {
        return _totalStakedAmount;
    }

    function isRedeemable() external view returns (bool) {
        //slither-disable-next-line timestamp
        return _isRewardsAvailable() && _isStakingPeriodComplete();
    }

    function isRewardsAvailable() external view returns (bool) {
        return _isRewardsAvailable();
    }

    function isStakingPeriodComplete() external view returns (bool) {
        return _isStakingPeriodComplete();
    }

    function _initializeRewardTokens(
        address benefactor,
        StakingPoolLib.Reward[] calldata _rewardTokens
    ) internal {
        for (uint256 i = 0; i < _rewardTokens.length; i++) {
            IERC20 tokens = IERC20(_rewardTokens[i].tokens);

            emit InitializeRewards(address(tokens), _rewardTokens[i].maxAmount);

            require(
                tokens.allowance(benefactor, address(this)) >=
                    _rewardTokens[i].maxAmount,
                "StakingPool: invalid allowance"
            );

            require(
                tokens.transferFrom(
                    benefactor,
                    address(this),
                    _rewardTokens[i].maxAmount
                ),
                "StakingPool: fund tx failed"
            );
        }
    }

    function _withdrawWithoutRewards() internal {
        User memory user = _users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        delete _users[_msgSender()];
        StakingPoolLib.Config memory _info = _stakingPoolInfo;
        _transferStake(uint256((user.depositAmount)), IERC20(_info.stakeToken));
    }

    function _setRewardsAvailableTimestamp(uint32 timestamp) internal {
        require(!_isStakingPeriodComplete(), "StakePool: already finalized");
        //slither-disable-next-line timestamp
        require(timestamp > block.timestamp, "StakePool: future rewards");

        _rewardsAvailableTimestamp = timestamp;
        emit RewardsAvailableTimestamp(timestamp);
    }

    function _transferStake(uint256 amount, IERC20 stakeToken) internal {
        emit WithdrawStake(_msgSender(), amount);
        _transferToken(amount, stakeToken);
    }

    function _transferRewards(uint256 amount, IERC20 rewardsToken) internal {
        emit WithdrawRewards(_msgSender(), address(rewardsToken), amount);
        _transferToken(amount, rewardsToken);
    }

    function _adminEmergencyRewardSweep() internal {
        StakingPoolLib.Reward[] memory rewards = _stakingPoolInfo.rewardTokens;
        address treasury = _stakingPoolInfo.treasury;

        for (uint256 i = 0; i < rewards.length; i++) {
            IERC20 token = IERC20(rewards[i].tokens);
            require(
                token.transfer(treasury, rewards[i].maxAmount),
                "StakingPool: withdraw tx failed"
            );
        }
    }

    function _isRewardsAvailable() internal view returns (bool) {
        //slither-disable-next-line timestamp
        return block.timestamp >= _rewardsAvailableTimestamp;
    }

    function _isStakingPeriodComplete() internal view returns (bool) {
        //slither-disable-next-line timestamp
        return
            block.timestamp >=
            (_stakingPoolInfo.epochStartTimestamp +
                _stakingPoolInfo.epochDuration);
    }

    function _calculateFloatingReward(
        uint256 rewardAmountRatio,
        uint128 depositAmount
    ) internal pure returns (uint128) {
        return uint128((rewardAmountRatio * depositAmount) / 1 ether);
    }

    function _computeFloatingRewardsPerShare(
        uint256 availableTokenRewards,
        uint256 total
    ) internal pure returns (uint256) {
        return (availableTokenRewards * 1 ether) / total;
    }

    function _transferToken(uint256 amount, IERC20 token) private {
        //slither-disable-next-line calls-loop
        require(token.transfer(_msgSender(), amount), "StakingPool: tx failed");
    }

    /**
     * @notice Updates the global reward ratios for each reward token in a floating reward pool
     */
    function _updateRewardsRatios(StakingPoolLib.Config storage _info) private {
        for (uint256 i = 0; i < _info.rewardTokens.length; i++) {
            _info.rewardTokens[i].ratio = _computeFloatingRewardsPerShare(
                _info.rewardTokens[i].maxAmount,
                _totalStakedAmount
            );
        }
    }

    /**
     * @notice Calculates and sets the users reward amount for a fixed reward pool
     */
    function _calculateFixedRewards(
        StakingPoolLib.Config memory _info,
        User storage user,
        uint256 amount
    ) private {
        for (uint256 i = 0; i < _info.rewardTokens.length; i++) {
            user.rewardAmounts[i] += uint128(
                (amount * _info.rewardTokens[i].ratio)
            );
        }
    }

    /**
     * @notice Enforces that each of the reward tokens are unique
     */
    function _enforceUniqueRewardTokens(
        StakingPoolLib.Reward[] calldata rewardPools
    ) private pure {
        for (uint256 i = 0; i < rewardPools.length; i++) {
            // Ensure no later entries contain the same tokens address
            uint256 next = i + 1;
            if (next < rewardPools.length) {
                for (uint256 j = next; j < rewardPools.length; j++) {
                    if (rewardPools[i].tokens == rewardPools[j].tokens) {
                        revert("Rewards: tokens must be unique");
                    }
                }
            }
        }
    }
}
