// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./BondIdentity.sol";
import "./BondSettings.sol";

/**
 * @title Deploys new Bonds.
 *
 * @notice Creating a Bond involves the two steps of deploying and initialising.
 */
interface BondCreator {
    event CreateBond(
        address indexed bond,
        string name,
        string debtSymbol,
        uint256 debtAmount,
        address indexed creator,
        address treasury,
        uint256 expiryTimestamp,
        uint256 minimumDeposit,
        string data
    );

    /**
     * @notice Deploys and initialises a new Bond.
     *
     * @param id Identity for the Bond to create.
     * @param config Values to use during the Bond creation process.
     */
    function createBond(BondIdentity calldata id, BondSettings calldata config)
        external
        returns (address);
}
