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
    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     */
    //slither-disable-next-line naming-convention
    function __BondAccessControl_init() internal onlyInitializing {
        __AccessControl_init();

        _setRoleAdmin(Roles.BOND_ADMIN, Roles.DAO_ADMIN);
        _setRoleAdmin(Roles.BOND_AGGREGATOR, Roles.DAO_ADMIN);
        _setRoleAdmin(Roles.DAO_ADMIN, Roles.DAO_ADMIN);
        _setRoleAdmin(Roles.SYSTEM_ADMIN, Roles.DAO_ADMIN);
        _setupRole(Roles.BOND_ADMIN, _msgSender());
        _setupRole(Roles.BOND_AGGREGATOR, _msgSender());
        _setupRole(Roles.DAO_ADMIN, _msgSender());
        _setupRole(Roles.SYSTEM_ADMIN, _msgSender());
    }
}
