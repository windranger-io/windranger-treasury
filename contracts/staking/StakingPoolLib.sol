// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library StakingPoolLib {
    enum RewardType {
        UNINITIALIZED,
        FIXED,
        FLOATING
    }

    struct Reward {
        address tokens;
        uint256 maxAmount;
        uint256 ratio; // only initialized for fixed
    }

    struct Config {
        uint256 daoId;
        uint128 minTotalPoolStake;
        uint128 maxTotalPoolStake;
        uint128 minimumContribution;
        uint32 epochDuration;
        uint32 epochStartTimestamp;
        address treasury;
        IERC20 stakeToken;
        Reward[] rewardTokens;
        RewardType rewardType;
    }
}
