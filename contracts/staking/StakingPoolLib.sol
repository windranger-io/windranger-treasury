// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library StakingPoolLib {
    enum RewardType {
        FIXED,
        FLOATING
    }

    struct Reward {
        address tokens;
        uint256 maxAmount;
    }

    struct Data {
        uint256 daoId;
        uint128 minTotalPoolStake;
        uint128 maxTotalPoolStake;
        uint128 minimumContribution;
        uint32 epochDuration;
        uint32 epochStartTimestamp;
        uint32 rewardsAvailableTimestamp;
        bool emergencyMode;
        bool launchPaused;
        address treasury;
        uint128 totalStakedAmount;
        IERC20 stakeToken;
        Reward[] rewardTokens;
        uint256[] ratios;
        RewardType rewardType;
    }
}
