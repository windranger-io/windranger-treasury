// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./Roles.sol";

/**
 * @title Access control dedicated for the Staking family of contracts.
 *
 * @notice Provides modifiers and management for access control required throughout the Staking contracts.
 */
abstract contract StakingAccessControl is AccessControlUpgradeable {
    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     */
    //slither-disable-next-line naming-convention
    function __StakingAccessControl_init() internal onlyInitializing {
        __AccessControl_init();

        _setRoleAdmin(Roles.SUPER_USER, Roles.SUPER_USER);
        _setRoleAdmin(Roles.DAO_MEEPLE, Roles.SUPER_USER);
        _setRoleAdmin(Roles.DAO_ADMIN, Roles.SUPER_USER);
        _setRoleAdmin(Roles.SYSTEM_ADMIN, Roles.SUPER_USER);

        _setupRole(Roles.SUPER_USER, _msgSender());
        _setupRole(Roles.DAO_MEEPLE, _msgSender());
        _setupRole(Roles.DAO_ADMIN, _msgSender());
        _setupRole(Roles.SYSTEM_ADMIN, _msgSender());
    }
}
