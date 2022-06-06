// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./StakingPoolLib.sol";

/**
 * @title Deploys new Bonds.
 *
 * @notice Creating a StakingPool involves the two steps of deploying and initialising.
 */
interface StakingPoolCreator {
    /**
     * @notice Deploys and initialises a new StakingPool.
     */
    function createStakingPool(
        StakingPoolLib.Config calldata config,
        bool launchPaused,
        uint32 rewardsAvailableTimestamp
    ) external returns (address);
}
