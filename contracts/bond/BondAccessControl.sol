// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./DaoAccessControl.sol";
import "./Roles.sol";

// TODO doco
//TODO add global / dao role explaination
// TODO explain tiers
/**
 * @title Access control dedicated for the Bond family of contracts.
 *
 * @notice Provides modifiers and management for access control required throughout the Bond contracts.
 */
abstract contract BondAccessControl is DaoAccessControl {
    modifier onlySuperUserRole() {
        if (_isMissingGlobalRole(Roles.SUPER_USER, _msgSender())) {
            revert(
                _revertMessageMissingGlobalRole(Roles.SUPER_USER, _msgSender())
            );
        }
        _;
    }

    modifier atLeastDaoCreatorRole() {
        if (
            _isMissingGlobalRole(Roles.SUPER_USER, _msgSender()) &&
            _isMissingGlobalRole(Roles.DAO_CREATOR, _msgSender())
        ) {
            revert(
                _revertMessageMissingGlobalRole(Roles.DAO_CREATOR, _msgSender())
            );
        }
        _;
    }

    modifier atLeastSysAdminRole() {
        if (
            _isMissingGlobalRole(Roles.SUPER_USER, _msgSender()) &&
            _isMissingGlobalRole(Roles.SYSTEM_ADMIN, _msgSender())
        ) {
            revert(
                _revertMessageMissingGlobalRole(
                    Roles.SYSTEM_ADMIN,
                    _msgSender()
                )
            );
        }
        _;
    }

    modifier atLeastDaoAminRole(uint256 daoId) {
        if (
            _isMissingGlobalRole(Roles.SUPER_USER, _msgSender()) &&
            _isMissingDaoRole(daoId, Roles.DAO_ADMIN, _msgSender())
        ) {
            revert(
                _revertMessageMissingDaoRole(
                    daoId,
                    Roles.DAO_ADMIN,
                    _msgSender()
                )
            );
        }
        _;
    }

    modifier atLeastDaoMeepleRole(uint256 daoId) {
        if (
            _isMissingGlobalRole(Roles.SUPER_USER, _msgSender()) &&
            _isMissingDaoRole(daoId, Roles.DAO_ADMIN, _msgSender()) &&
            _isMissingDaoRole(daoId, Roles.DAO_MEEPLE, _msgSender())
        ) {
            revert(
                _revertMessageMissingDaoRole(
                    daoId,
                    Roles.DAO_MEEPLE,
                    _msgSender()
                )
            );
        }
        _;
    }

    function grantSuperUserRole(address account) external onlySuperUserRole {
        _grantGlobalRole(Roles.SUPER_USER, account);
    }

    function grantDaoCreatorRole(address account) external onlySuperUserRole {
        _grantGlobalRole(Roles.DAO_CREATOR, account);
    }

    function grantSysAdminRole(address account) external atLeastSysAdminRole {
        _grantGlobalRole(Roles.DAO_CREATOR, account);
    }

    function grantDaoAdminRole(uint256 daoId, address account)
        external
        atLeastDaoAminRole(daoId)
    {
        _grantDaoRole(daoId, Roles.DAO_ADMIN, account);
    }

    function grantDaoMeepleRole(uint256 daoId, address account)
        external
        atLeastDaoAminRole(daoId)
    {
        _grantDaoRole(daoId, Roles.DAO_MEEPLE, account);
    }

    function revokeSuperUserRole(address account) external onlySuperUserRole {
        _revokeGlobalRole(Roles.SUPER_USER, account);
    }

    function revokeDaoCreatorRole(address account) external onlySuperUserRole {
        _revokeGlobalRole(Roles.DAO_CREATOR, account);
    }

    function revokeSysAdminRole(address account) external atLeastSysAdminRole {
        _revokeGlobalRole(Roles.DAO_CREATOR, account);
    }

    function revokeDaoAdminRole(uint256 daoId, address account)
        external
        atLeastDaoAminRole(daoId)
    {
        _revokeDaoRole(daoId, Roles.DAO_ADMIN, account);
    }

    function revokeDaoMeepleRole(uint256 daoId, address account)
        external
        atLeastDaoAminRole(daoId)
    {
        _revokeDaoRole(daoId, Roles.DAO_MEEPLE, account);
    }

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
}
