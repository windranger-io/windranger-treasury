// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @title Roles within the hierarchical DAO access control schema.
 *
 * @notice Similar to a Linux permission system there is a super user, with some of the other roles being tiered
 *          amongst each other.
 *
 *  SUPER_USER role the manage for DAO_CREATOR roles, in addition to being a super set to to all other roles functions.
 *  DAO_CREATOR role only business is creating DAOs and their configurations.
 *  DAO_ADMIN role can update the DAOs configuration and may intervene to sweep / flush.
 *  DAO_MEEPLE role is deals with the life cycle of the DAOs products.
 *  SYSTEM_ADMIN role deals with tasks such as pause-ability and the upgrading of contract.
 */
library Roles {
    bytes32 public constant DAO_ADMIN = "DAO_ADMIN";
    bytes32 public constant DAO_CREATOR = "DAO_CREATOR";
    bytes32 public constant DAO_MEEPLE = "DAO_MEEPLE";
    bytes32 public constant SUPER_USER = "SUPER_USER";
    bytes32 public constant SYSTEM_ADMIN = "SYSTEM_ADMIN";
}
