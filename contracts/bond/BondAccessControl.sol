// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./Roles.sol";

/**
 * @title Access control dedicated for the Bond family of contracts.
 *
 * @notice Provides modifiers and management for access control required throughout the Bond contracts.
 */
abstract contract BondAccessControl is AccessControlUpgradeable {
    //    bytes32 public constant SUPER_USER = "SUPER_USER";
    //    bytes32 public constant DAO_ADMIN = "DAO_ADMIN";
    //    bytes32 public constant DAO_CREATOR = "DAO_CREATOR";
    //    bytes32 public constant DAO_MEEPLE = "DAO_MEEPLE";
    //    bytes32 public constant SYSTEM_ADMIN = "SYSTEM_ADMIN";

    modifier hasRole() {
        // TODO code
        _;
    }

    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     */
    //slither-disable-next-line naming-convention
    function __BondAccessControl_init() internal onlyInitializing {
        __AccessControl_init();

        /*
         * Super Users administrate themselves, DAO Creators and SysAdmins.
         */
        _setRoleAdmin(Roles.SUPER_USER, Roles.SUPER_USER);
        _setRoleAdmin(Roles.DAO_CREATOR, Roles.SUPER_USER);
        _setRoleAdmin(Roles.SYSTEM_ADMIN, Roles.SUPER_USER);

        _setRoleAdmin(Roles.DAO_ADMIN, Roles.DAO_ADMIN);
        _setRoleAdmin(Roles.BOND_ADMIN, Roles.DAO_ADMIN);

        _setupRole(Roles.BOND_ADMIN, _msgSender());
        _setupRole(Roles.DAO_ADMIN, _msgSender());
        _setupRole(Roles.SYSTEM_ADMIN, _msgSender());
    }

    // TODO update doco - tiered access control

    // TOOD restrict DAO admins & DAO Meeple to their DAOs

    // TODO single role admin?

    // TODO explicit modifiers
}
