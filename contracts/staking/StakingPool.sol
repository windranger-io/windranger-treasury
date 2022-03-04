// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./StakingPoolInfo.sol";

abstract contract StakingPool {
    StakingPoolInfo.StakingPoolData public stakingPoolInfo;

    event WithdrawRewards(
        address indexed user,
        address rewardToken,
        uint256 rewards
    );

    event Withdraw(address indexed user, uint256 stake);

    event WithdrawWithoutRewards(address indexed user, uint256 stake);

    event Deposit(address indexed user, uint256 depositAmount);

    modifier rewardsFinalized() {
        require(_isRewardsFinalized(), "FixedStaking: not finalized");
        _;
    }

    modifier stakingPeriodComplete() {
        require(_isStakingPeriodComplete(), "FixedStaking: still stake period");
        _;
    }

    modifier stakingPoolRequirementsUnmet() {
        require(
            (stakingPoolInfo.totalStakedAmount <
                stakingPoolInfo.minTotalPoolStake) &&
                (block.timestamp > stakingPoolInfo.epochStartTimestamp),
            "FixedStaking: requirements unmet"
        );
        _;
    }

    modifier stakingPeriodNotStarted() {
        require(
            block.timestamp < stakingPoolInfo.epochStartTimestamp,
            "FixedStaking: too early"
        );
        _;
    }

    modifier stakingPoolNotFull(uint256 _deposit) {
        require(
            stakingPoolInfo.totalStakedAmount + _deposit <
                stakingPoolInfo.maxTotalPoolStake,
            "FixedStaking: pool full"
        );
        _;
    }

    function isReedemable() external view returns (bool) {
        // rewardsFinalized stakingPeriodComplete
        return _isRewardsFinalized() && _isStakingPeriodComplete();
    }

    function _isRewardsFinalized() internal view returns (bool) {
        return
            (block.timestamp > stakingPoolInfo.rewardUnlockTimestamp) &&
            stakingPoolInfo.rewardsFinalized;
    }

    function _isStakingPeriodComplete() internal view returns (bool) {
        return
            block.timestamp >
            (stakingPoolInfo.epochStartTimestamp +
                stakingPoolInfo.epochDuration);
    }
}
