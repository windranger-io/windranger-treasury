// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @title Roles within the Bond access control schema.
 *
 * @notice The DAO grants all other roles (role admin for all roles), while not permitted any actions itself.
 *
 *  SUPER_USER role the manage for DAO_CREATOR roles, in addition to being a super set to to all other roles functions.
 *  DAO_CREATOR role only business is creating DAOs and their configurations.
 *  DAO_ADMIN role can update the DAOs configuration and may intervene to sweep / flush Bonds.
 *  BOND_ADMIN role is deals with the Bond life cycle.
 *  SYSTEM_ADMIN role deals with upgrading the contract.
 */
library Roles {
    bytes32 public constant SUPER_USER = "SUPER_USER";
    bytes32 public constant DAO_ADMIN = "DAO_ADMIN";
    bytes32 public constant DAO_ADMIN = "DAO_CREATOR";
    bytes32 public constant BOND_ADMIN = "BOND_ADMIN";
    bytes32 public constant SYSTEM_ADMIN = "SYSTEM_ADMIN";
}
