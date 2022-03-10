// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./DaoAccessControl.sol";
import "./Roles.sol";

//TODO add global / dao role explaination
/**
 * @title Access control dedicated for the Bond family of contracts.
 *
 * @notice Provides modifiers and management for access control required throughout the Bond contracts.
 */
abstract contract BondAccessControl is DaoAccessControl {
    //    bytes32 public constant SUPER_USER = "SUPER_USER";
    //    bytes32 public constant DAO_ADMIN = "DAO_ADMIN";
    //    bytes32 public constant DAO_CREATOR = "DAO_CREATOR";
    //    bytes32 public constant DAO_MEEPLE = "DAO_MEEPLE";
    //    bytes32 public constant SYSTEM_ADMIN = "SYSTEM_ADMIN";

    /**
     * @notice The _msgSender() is given membership of the SuperUser role.
     *
     * @dev Allows granting and future renouncing after other addresses have been setup.
     */
    //slither-disable-next-line naming-convention
    function __BondAccessControl_init() internal onlyInitializing {
        __DaoAccessControl_init();

        /*
         * Super Users administrate themselves, DAO Creators and SysAdmins.
         */
        _addGlobalRoleAdmin(Roles.SUPER_USER, Roles.SUPER_USER);
        _addGlobalRoleAdmin(Roles.DAO_CREATOR, Roles.SUPER_USER);
        _addGlobalRoleAdmin(Roles.SYSTEM_ADMIN, Roles.SUPER_USER);

        _grantGlobalRole(Roles.SUPER_USER, _msgSender());
    }

    // TODO function to add dao, assign super user role type to all

    // TODO update doco - tiered access control

    // TODO explicit modifiers
}
