// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Bond.sol";

/**
 * @title Deploys new Bonds.
 *
 * @notice Creating a Bond involves the two steps of deploying and initialising.
 */
interface BondCreator {
    /**
     * @notice Deploys and initialises a new Bond.
     *
     * @param metadata General details about the Bond no essential for operation.
     * @param configuration Values to use during the Bond creation process.
     * @param rewards Motivation for the guarantors to deposit, available after redemption.
     * @param treasury Receiver of any slashed or swept tokens or collateral.
     */
    function createBond(
        Bond.MetaData calldata metadata,
        Bond.Settings calldata configuration,
        Bond.TimeLockRewardPool[] calldata rewards,
        address treasury
    ) external returns (address);
}
