// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./StakingPool.sol";
import "../RoleAccessControl.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

import "hardhat/console.sol";

abstract contract StakingPoolBase is
    Initializable,
    RoleAccessControl,
    ReentrancyGuard
{
    struct User {
        uint128 depositAmount;
        uint128[] rewardAmounts;
    }

    mapping(address => User) public users;

    StakingPool.Data public stakingPoolInfo;

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
            (stakingPoolInfo.totalStakedAmount <
                stakingPoolInfo.minTotalPoolStake) &&
                (block.timestamp > stakingPoolInfo.epochStartTimestamp),
            "StakingPool: requirements unmet"
        );
        _;
    }

    modifier emergencyModeEnabled() {
        require(
            stakingPoolInfo.emergencyMode,
            "StakingPool: not emergency mode"
        );
        _;
    }

    modifier stakingPeriodNotStarted() {
        require(
            block.timestamp >= stakingPoolInfo.epochStartTimestamp,
            "StakingPool: too early"
        );
        _;
    }

    modifier stakingPoolNotFull(uint256 _deposit) {
        require(
            stakingPoolInfo.totalStakedAmount + _deposit <
                stakingPoolInfo.maxTotalPoolStake,
            "StakingPool: pool full"
        );
        _;
    }

    // withdraw stake separately from rewards (rewards may not be available yet)
    function withdrawStake() external stakingPeriodComplete nonReentrant {
        User memory user = users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        emit Withdraw(_msgSender(), user.depositAmount);
        user.depositAmount = 0;

        require(
            stakingPoolInfo.stakeToken.transfer(
                _msgSender(),
                uint256(user.depositAmount)
            ),
            "StakingPool: stake tx fail"
        );
    }

    // withdraw when the pool is not going ahead
    function withdrawWithoutRewards() external stakingPoolRequirementsUnmet {
        _withdrawWithoutRewards();
    }

    function initialize(StakingPool.Data calldata info)
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

        stakingPoolInfo = info;
    }

    function emergencyWithdraw() external emergencyModeEnabled {
        _withdrawWithoutRewards();
    }

    function initializeRewardTokens(
        address treasury,
        StakingPool.RewardToken[] calldata rewardTokens
    ) external atLeastDaoMeepleRole(stakingPoolInfo.daoId) {
        _initializeRewardTokens(treasury, rewardTokens);
    }

    function adminEmergencyRewardSweep()
        external
        atLeastDaoAminRole(stakingPoolInfo.daoId)
        emergencyModeEnabled
    {
        _adminEmergencyRewardSweep();
    }

    function enableEmergencyMode()
        external
        atLeastDaoAminRole(stakingPoolInfo.daoId)
    {
        stakingPoolInfo.emergencyMode = true;
    }

    function isReedemable() external view returns (bool) {
        return _isRewardsAvailable() && _isStakingPeriodComplete();
    }

    function isRewardsFinalized() external view returns (bool) {
        return _isRewardsAvailable();
    }

    function _initializeRewardTokens(
        address treasury,
        StakingPool.RewardToken[] calldata _rewardTokens
    ) internal {
        for (uint256 i = 0; i < _rewardTokens.length; i++) {
            IERC20 token = IERC20(_rewardTokens[i].rewardToken);

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
        User memory user = users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        delete users[_msgSender()];
        _transferStake(uint256((user.depositAmount)));
    }

    function _setRewardsAvailableRewards(uint32 availableTimestamp) internal {
        require(!_isStakingPeriodComplete(), "StakePool: already finalized");
        stakingPoolInfo.rewardsAvailableTimestamp = availableTimestamp;
        emit RewardsAvailableTimestamp(availableTimestamp);
    }

    function _transferStake(uint256 amount) internal {
        emit WithdrawWithoutRewards(_msgSender(), amount);
        require(
            stakingPoolInfo.stakeToken.transfer(msg.sender, amount),
            "StakingPool: stake tx fail"
        );
    }

    function _adminEmergencyRewardSweep() internal {
        StakingPool.RewardToken[] memory rewardTokens = stakingPoolInfo
            .rewardTokens;
        address treasury = stakingPoolInfo.treasury;

        for (uint256 i = 0; i < rewardTokens.length; i++) {
            IERC20 token = IERC20(rewardTokens[i].rewardToken);
            require(
                token.transfer(
                    treasury,
                    rewardTokens[i].totalTokenRewardsAvailable
                ),
                "StakingPool: withdraw tx failed"
            );
        }
    }

    function _isRewardsAvailable() internal view returns (bool) {
        return block.timestamp >= stakingPoolInfo.rewardsAvailableTimestamp;
    }

    function _isStakingPeriodComplete() internal view returns (bool) {
        return
            block.timestamp >=
            (stakingPoolInfo.epochStartTimestamp +
                stakingPoolInfo.epochDuration);
    }
}
