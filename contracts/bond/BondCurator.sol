// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @title Manages interactions with Bonds.
 *
 * @notice A facade providing access control and a central place to discover created Bond contracts.
 *
 * @dev The curator is the owner of all Bonds it manages, guarding function accordingly allows finer access control
 *      to be provided.
 */
abstract contract BondCurator {
    /**
     * @notice Before a Bond can be managed, it must first be added.
     *
     * @param bond Deployed Bond contract, with the Owner set as the BondCurator.
     */
    function addBond(address bond) external virtual;
}
