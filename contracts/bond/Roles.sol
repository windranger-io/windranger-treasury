// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @title Roles within the Bond access control schema.
 *
 * @notice The DAO grants all other roles (role admin for all roles), while not permitted any actions itself.
 *
 *  BOND_ADMIN role is deals with the Bond life cycle.
 *  BOND_AGGREGATOR roles collates bonds together in one place.
 *  SYSTEM_ADMIN role deals with upgrading the contract.
 */
library Roles {
    bytes32 public constant DAO_ADMIN = "DAO_ADMIN";
    bytes32 public constant BOND_ADMIN = "BOND_ADMIN";
    bytes32 public constant BOND_AGGREGATOR = "BOND_AGGREGATOR";
    bytes32 public constant SYSTEM_ADMIN = "SYSTEM_ADMIN";
}
