// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "../RoleAccessControl.sol";
import "./StakingPoolLib.sol";

/**
 * @title StakingPool with optional fixed or floating token rewards
 *
 * @notice Users can deposit a stake token into the pool up to the specified pool maximum contribution.
 * If the minimum criteria for the pool to go ahead are met, stake tokens are locked for an epochDuration.
 * After this period expires the user can withdraw their stake token and reward tokens (if available) separately.
 * The amount of rewards is determined by the pools rewardType - a floating reward ratio is updated on each deposit
 * while fixed tokens rewards are calculated once per user.
 */
contract StakingPool is
    PausableUpgradeable,
    ReentrancyGuard,
    RoleAccessControl
{
    using SafeERC20 for IERC20;

    // Magic Number fixed length rewardsAmounts to fit 3 words. Only used here.
    struct User {
        uint128 depositAmount;
        uint128[5] rewardAmounts;
    }

    struct RewardOwed {
        address tokens;
        uint128 amount;
    }

    mapping(address => User) private _users;

    uint32 private _rewardsAvailableTimestamp;
    bool private _emergencyMode;
    uint128 private _totalStakedAmount;

    StakingPoolLib.Config private _stakingPoolConfig;

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
    event NoRewards(address indexed user);

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
            (_totalStakedAmount < _stakingPoolConfig.minTotalPoolStake) &&
                (block.timestamp > _stakingPoolConfig.epochStartTimestamp),
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
        atLeastDaoMeepleRole(_stakingPoolConfig.daoId)
    {
        _pause();
    }

    function unpause()
        external
        whenPaused
        atLeastDaoMeepleRole(_stakingPoolConfig.daoId)
    {
        _unpause();
    }

    /**
     * @notice Only entry point for a user to deposit into the staking pool
     *
     * @param amount Amount of stake tokens to deposit
     */
    function deposit(uint128 amount) external whenNotPaused nonReentrant {
        StakingPoolLib.Config storage _config = _stakingPoolConfig;

        require(
            amount >= _config.minimumContribution,
            "StakingPool: min contribution"
        );
        require(
            _totalStakedAmount + amount <= _config.maxTotalPoolStake,
            "StakingPool: oversubscribed"
        );
        //slither-disable-next-line timestamp
        require(
            block.timestamp < _config.epochStartTimestamp,
            "StakingPool: too late"
        );

        User storage user = _users[_msgSender()];

        user.depositAmount += amount;
        _totalStakedAmount += amount;

        emit Deposit(_msgSender(), amount);

        // calculate/update rewards
        if (_config.rewardType == StakingPoolLib.RewardType.FLOATING) {
            _updateRewardsRatios(_config);
        }
        if (_config.rewardType == StakingPoolLib.RewardType.FIXED) {
            _calculateFixedRewards(_config, user, amount);
        }

        _config.stakeToken.safeTransferFrom(
            _msgSender(),
            address(this),
            amount
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

        StakingPoolLib.Config storage _config = _stakingPoolConfig;

        //slither-disable-next-line reentrancy-events
        _transferStake(user.depositAmount, IERC20(_config.stakeToken));

        _withdrawRewards(_config, user);
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

        StakingPoolLib.Config storage _config = _stakingPoolConfig;

        // set users floating reward
        for (uint256 i = 0; i < _config.rewardTokens.length; i++) {
            if (_config.rewardType == StakingPoolLib.RewardType.FLOATING) {
                user.rewardAmounts[i] = _calculateFloatingReward(
                    _config.rewardTokens[i].ratio,
                    currentDepositBalance
                );
            }
        }

        _transferStake(currentDepositBalance, IERC20(_config.stakeToken));
    }

    /**
     * @notice Withdraw only reward tokens. Stake must have already been withdrawn.
     */
    function withdrawRewards()
        external
        stakingPeriodComplete
        rewardsAvailable
        whenNotPaused
    {
        StakingPoolLib.Config memory _config = _stakingPoolConfig;

        User memory user = _users[_msgSender()];
        require(user.depositAmount == 0, "StakingPool: withdraw stake");
        delete _users[_msgSender()];

        bool noRewards = true;

        for (uint256 i = 0; i < user.rewardAmounts.length; i++) {
            if (user.rewardAmounts[i] > 0) {
                noRewards = false;
                //slither-disable-next-line calls-loop
                _transferRewards(
                    user.rewardAmounts[i],
                    IERC20(_config.rewardTokens[i].tokens)
                );
            }
        }
        if (noRewards) {
            emit NoRewards(_msgSender());
        }
    }

    /**
     * @notice Withdraw stake tokens when minimum pool conditions to begin are not met
     */
    function earlyWithdraw()
        external
        stakingPoolRequirementsUnmet
        whenNotPaused
    {
        _withdrawWithoutRewards();
    }

    /**
     * @notice Withdraw stake tokens when admin has enabled emergency mode
     */
    function emergencyWithdraw() external emergencyModeEnabled {
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
            "StakingPool: start >= now"
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
        emit RewardsAvailableTimestamp(rewardsTimestamp);

        _stakingPoolConfig = info;
    }

    function initializeRewardTokens(
        address benefactor,
        StakingPoolLib.Reward[] calldata rewards
    ) external atLeastDaoMeepleRole(_stakingPoolConfig.daoId) {
        _initializeRewardTokens(benefactor, rewards);
    }

    function enableEmergencyMode()
        external
        atLeastDaoAdminRole(_stakingPoolConfig.daoId)
    {
        _emergencyMode = true;
        emit EmergencyMode(_msgSender());

        _adminEmergencyRewardSweep();
    }

    function setRewardsAvailableTimestamp(uint32 timestamp)
        external
        atLeastDaoAdminRole(_stakingPoolConfig.daoId)
    {
        _setRewardsAvailableTimestamp(timestamp);
    }

    function currentExpectedRewards(address user)
        external
        view
        returns (uint256[] memory)
    {
        User memory _user = _users[user];
        StakingPoolLib.Config memory _config = _stakingPoolConfig;

        uint256[] memory rewards = new uint256[](_config.rewardTokens.length);

        for (uint256 i = 0; i < _config.rewardTokens.length; i++) {
            if (_config.rewardType == StakingPoolLib.RewardType.FLOATING) {
                if (_user.depositAmount == 0) {
                    // user has already withdrawn stake
                    rewards[i] = _user.rewardAmounts[i];
                } else {
                    // user has not withdraw stake yet
                    rewards[i] = _calculateFloatingReward(
                        _config.rewardTokens[i].ratio,
                        _user.depositAmount
                    );
                }
            }
            if (_config.rewardType == StakingPoolLib.RewardType.FIXED) {
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
        return _stakingPoolConfig;
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

    /**
     * @notice Returns the final amount of reward due for a user
     *
     * @param user address to calculate rewards for
     */
    function currentRewards(address user)
        external
        view
        returns (RewardOwed[] memory)
    {
        User memory _user = _users[user];
        StakingPoolLib.Config memory _config = _stakingPoolConfig;

        RewardOwed[] memory rewards = new RewardOwed[](
            _config.rewardTokens.length
        );

        for (uint256 i = 0; i < _config.rewardTokens.length; i++) {
            if (_config.rewardType == StakingPoolLib.RewardType.FLOATING) {
                rewards[i] = RewardOwed({
                    amount: _calculateFloatingReward(
                        _config.rewardTokens[i].ratio,
                        _user.depositAmount
                    ),
                    tokens: _config.rewardTokens[i].tokens
                });
            }
            if (_config.rewardType == StakingPoolLib.RewardType.FIXED) {
                rewards[i] = RewardOwed({
                    amount: _user.rewardAmounts[i],
                    tokens: _config.rewardTokens[i].tokens
                });
            }
        }
        return rewards;
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

            tokens.safeTransferFrom(
                benefactor,
                address(this),
                _rewardTokens[i].maxAmount
            );
        }
    }

    function _withdrawWithoutRewards() internal {
        User memory user = _users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        delete _users[_msgSender()];
        StakingPoolLib.Config memory _config = _stakingPoolConfig;
        _transferStake(
            uint256((user.depositAmount)),
            IERC20(_config.stakeToken)
        );
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
        StakingPoolLib.Reward[] memory rewards = _stakingPoolConfig
            .rewardTokens;
        address treasury = _stakingPoolConfig.treasury;

        for (uint256 i = 0; i < rewards.length; i++) {
            IERC20 token = IERC20(rewards[i].tokens);
            token.safeTransfer(treasury, token.balanceOf(address(this)));
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
            (_stakingPoolConfig.epochStartTimestamp +
                _stakingPoolConfig.epochDuration);
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
        token.safeTransfer(_msgSender(), amount);
    }

    /**
     * @notice Updates the global reward ratios for each reward token in a floating reward pool
     */
    function _updateRewardsRatios(StakingPoolLib.Config storage _config)
        private
    {
        for (uint256 i = 0; i < _config.rewardTokens.length; i++) {
            _config.rewardTokens[i].ratio = _computeFloatingRewardsPerShare(
                _config.rewardTokens[i].maxAmount,
                _totalStakedAmount
            );
        }
    }

    /**
     * @notice Calculates and sets the users reward amount for a fixed reward pool
     */
    function _calculateFixedRewards(
        StakingPoolLib.Config memory _config,
        User storage user,
        uint256 amount
    ) private {
        for (uint256 i = 0; i < _config.rewardTokens.length; i++) {
            user.rewardAmounts[i] += uint128(
                (amount * _config.rewardTokens[i].ratio)
            );
        }
    }

    function _withdrawRewards(
        StakingPoolLib.Config memory _config,
        User memory user
    ) private {
        bool noRewards = true;

        // calculate the rewardAmounts due to the user
        for (uint256 i = 0; i < _config.rewardTokens.length; i++) {
            uint256 amount = 0;

            if (_config.rewardType == StakingPoolLib.RewardType.FLOATING) {
                amount = _calculateFloatingReward(
                    _config.rewardTokens[i].ratio,
                    user.depositAmount
                );
            }
            if (_config.rewardType == StakingPoolLib.RewardType.FIXED) {
                amount = uint256(user.rewardAmounts[i]);
            }
            if (amount > 0) {
                noRewards = false;
                //slither-disable-next-line calls-loop
                _transferRewards(
                    amount,
                    IERC20(_config.rewardTokens[i].tokens)
                );
            }
        }
        if (noRewards) {
            emit NoRewards(_msgSender());
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
