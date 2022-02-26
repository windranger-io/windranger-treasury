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
interface BondCurator {
    event AddBond(uint256 daiId, address bond);

    /**
     * @notice Before a Bond can be managed, it must first be added.
     *
     * @param daoId The DAO to whom the bond belongs.
     * @param bond Deployed Bond contract, with the Owner set as the BondCurator.
     */
    function addBond(uint256 daoId, address bond) external;
}
