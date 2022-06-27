// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./PerformanceBond.sol";

/**
 * @title Deploys new PerformanceBonds.
 *
 * @notice Creating a Performance Bond involves the two steps of deploying and initialising.
 */
interface PerformanceBondCreator {
    /**
     * @notice Deploys and initialises a new PerformanceBond.
     *
     * @param metadata General details about the Bond no essential for operation.
     * @param configuration Values to use during the Bond creation process.
     * @param rewards Motivation for the guarantors to deposit, available after redemption.
     * @param treasury Receiver of any slashed or swept tokens or collateral.
     */
    function createPerformanceBond(
        PerformanceBond.MetaData calldata metadata,
        PerformanceBond.Settings calldata configuration,
        PerformanceBond.TimeLockRewardPool[] calldata rewards,
        address treasury
    ) external returns (address);
}
