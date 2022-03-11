// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library StakingPoolInfo {
    enum StakingPoolType {
        FIXED,
        FLOATING
    }

    struct RewardToken {
        address rewardToken;
        uint32 rewardAmountRatio; // denominated in fixed point ETHER
        uint256 totalTokenRewardsAvailable; // NOTE: ask cooper whether reward amount is fixed
    }

    struct StakingPoolData {
        uint128 minTotalPoolStake;
        uint128 maxTotalPoolStake;
        uint128 minimumContribution;
        uint32 epochDuration;
        uint32 epochStartTimestamp;
        bool rewardsFinalized;
        address treasury;
        uint128 totalStakedAmount;
        IERC20 stakeToken;
        RewardToken[] rewardTokens;
    }

    event StakingPoolCreated(
        address indexed stakingPool,
        address treasury,
        address indexed creator,
        StakingPoolInfo.RewardToken[] rewardTokens,
        address stakeToken,
        uint128 epochStartTimestamp,
        uint128 epochDuration,
        uint128 minimumContribution,
        StakingPoolType stakingPoolType
    );
}
