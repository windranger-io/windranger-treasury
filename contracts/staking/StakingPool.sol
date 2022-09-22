// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./StakingPoolLib.sol";
import "../Version.sol";
import "../sweep/SweepERC20.sol";

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
    OwnableUpgradeable,
    SweepERC20,
    Version
{
    using SafeERC20 for IERC20;

    // Magic Number fixed length rewardsAmounts to fit 3 words. Only used here.
    struct User {
        uint128 depositAmount;
        uint128[5] rewardAmounts;
    }

    struct RewardOwed {
        IERC20 tokens;
        uint128 amount;
    }

    mapping(address => User) private _users;
    mapping(address => bool) private _supportedRewards;

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

    modifier minTotalPoolStakeMet() {
        require(_isMinTotalPoolStakeMet(), "StakingPool: min total stake");
        _;
    }

    modifier stakingPoolRequirementsUnmet() {
        //slither-disable-next-line timestamp
        require(
            _isMinTotalPoolStakeMet() &&
                (block.timestamp > _stakingPoolConfig.epochStartTimestamp),
            "StakingPool: requirements unmet"
        );
        _;
    }

    modifier emergencyModeEnabled() {
        require(_emergencyMode, "StakingPool: not emergency mode");
        _;
    }

    function pause() external whenNotPaused onlyOwner {
        _pause();
    }

    function unpause() external whenPaused onlyOwner {
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
        minTotalPoolStakeMet
        rewardsAvailable
        nonReentrant
    {
        User memory user = _users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        delete _users[_msgSender()];

        StakingPoolLib.Config storage _config = _stakingPoolConfig;

        //slither-disable-next-line reentrancy-events
        _transferStake(user.depositAmount, _config.stakeToken);

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
        _withdrawStake();
    }

    /**
     * @notice Withdraw only reward tokens. Stake must have already been withdrawn.
     */
    function withdrawRewards()
        external
        stakingPeriodComplete
        minTotalPoolStakeMet
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
                    _config.rewardTokens[i].tokens
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
        _withdrawStake();
    }

    function sweepERC20Tokens(address tokens, uint256 amount)
        external
        whenNotPaused
        onlyOwner
    {
        _sweepERC20Tokens(tokens, amount);
    }

    function initialize(
        StakingPoolLib.Config calldata info,
        bool paused,
        uint32 rewardsTimestamp,
        address beneficiary
    ) external virtual initializer {
        __Context_init_unchained();
        __Pausable_init();
        __Ownable_init();
        __TokenSweep_init(beneficiary);

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
        require(info.treasury != address(0), "StakePool: treasury address 0");
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
    ) external onlyOwner {
        _initializeRewardTokens(benefactor, rewards);
    }

    function enableEmergencyMode() external onlyOwner {
        _emergencyMode = true;
        emit EmergencyMode(_msgSender());
    }

    function adminEmergencyRewardSweep()
        external
        emergencyModeEnabled
        onlyOwner
    {
        _adminEmergencyRewardSweep();
    }

    function setRewardsAvailableTimestamp(uint32 timestamp) external onlyOwner {
        _setRewardsAvailableTimestamp(timestamp);
    }

    function updateTokenSweepBeneficiary(address newBeneficiary)
        external
        whenNotPaused
        onlyOwner
    {
        _setTokenSweepBeneficiary(newBeneficiary);
    }

    function isMinTotalPoolStakeMet() external view returns (bool) {
        return _isMinTotalPoolStakeMet();
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
            rewards[i] = _calculateRewardAmount(_config, _user, i);
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

    function getUser(address activeUser) external view returns (User memory) {
        return _users[activeUser];
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
        _enforceUniqueRewardTokens(_rewardTokens);
        for (uint256 i = 0; i < _rewardTokens.length; i++) {
            emit InitializeRewards(
                address(_rewardTokens[i].tokens),
                _rewardTokens[i].maxAmount
            );

            require(
                _rewardTokens[i].tokens.allowance(benefactor, address(this)) >=
                    _rewardTokens[i].maxAmount,
                "StakingPool: invalid allowance"
            );

            _rewardTokens[i].tokens.safeTransferFrom(
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
        _transferStake(uint256((user.depositAmount)), _config.stakeToken);
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
            rewards[i].tokens.safeTransfer(
                treasury,
                rewards[i].tokens.balanceOf(address(this))
            );
        }
    }

    function _withdrawStake() internal {
        User storage user = _users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        uint128 currentDepositBalance = user.depositAmount;
        user.depositAmount = 0;

        StakingPoolLib.Config storage _config = _stakingPoolConfig;
        // set users floating reward if applicable
        if (_config.rewardType == StakingPoolLib.RewardType.FLOATING) {
            for (uint256 i = 0; i < _config.rewardTokens.length; i++) {
                user.rewardAmounts[i] = _calculateFloatingReward(
                    _config.rewardTokens[i].ratio,
                    currentDepositBalance
                );
            }
        }
        _transferStake(currentDepositBalance, _config.stakeToken);
    }

    function _isRewardsAvailable() internal view returns (bool) {
        //slither-disable-next-line timestamp
        return block.timestamp >= _rewardsAvailableTimestamp;
    }

    function _isMinTotalPoolStakeMet() internal view returns (bool) {
        return _totalStakedAmount >= _stakingPoolConfig.minTotalPoolStake;
    }

    function _isStakingPeriodComplete() internal view returns (bool) {
        //slither-disable-next-line timestamp
        return
            block.timestamp >=
            (_stakingPoolConfig.epochStartTimestamp +
                _stakingPoolConfig.epochDuration);
    }

    function _calculateRewardAmount(
        StakingPoolLib.Config memory _config,
        User memory _user,
        uint256 rewardIndex
    ) internal pure returns (uint256) {
        if (_config.rewardType == StakingPoolLib.RewardType.FIXED) {
            return _user.rewardAmounts[rewardIndex];
        }

        if (_config.rewardType == StakingPoolLib.RewardType.FLOATING) {
            if (_user.depositAmount == 0) {
                // user has already withdrawn stake
                return _user.rewardAmounts[rewardIndex];
            }

            // user has not withdrawn stake yet
            return
                _calculateFloatingReward(
                    _config.rewardTokens[rewardIndex].ratio,
                    _user.depositAmount
                );
        }
        return 0;
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
            uint256 amount = _calculateRewardAmount(_config, user, i);

            if (amount > 0) {
                noRewards = false;
                //slither-disable-next-line calls-loop
                _transferRewards(amount, _config.rewardTokens[i].tokens);
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
    ) private {
        for (uint256 i = 0; i < rewardPools.length; i++) {
            // Ensure no prev entries contain the same tokens address
            require(
                !_supportedRewards[address(rewardPools[i].tokens)],
                "StakePool: tokens must be unique"
            );
            _supportedRewards[address(rewardPools[i].tokens)] = true;
        }
        for (uint256 i = 0; i < rewardPools.length; i++) {
            delete _supportedRewards[address(rewardPools[i].tokens)];
        }
    }
}
