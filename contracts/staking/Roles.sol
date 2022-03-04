// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @title Roles within the Bond access control schema.
 *
 * @notice The DAO grants all other roles (role admin for all roles), while not permitted any actions itself.
 *
 */
library Roles {
    bytes32 public constant SUPER_USER = "SUPER_USER";
    bytes32 public constant DAO_ADMIN = "DAO_ADMIN";
    bytes32 public constant SYSTEM_ADMIN = "SYSTEM_ADMIN";
    bytes32 public constant DAO_MEEPLE = "DAO_MEEPLE";
}
