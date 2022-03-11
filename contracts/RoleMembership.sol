// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/**
 * @title Role based set membership.
 *
 * @notice Encapsulation of tracking, management and validation of role membership of addresses.
 *
 *  A role is a bytes32 value.
 *
 *  There are two distinct classes of roles:
 *  - Global; without scope limit.
 *  - Dao; membership scoped to that of the key (uint256).
 *
 * @dev Meaningful application of role membership is expected to come from derived contracts.
 *      e.g. access control.
 */
abstract contract RoleMembership is Initializable {
    // DAOs to their roles to members; scoped to an individual DAO
    mapping(uint256 => mapping(bytes32 => mapping(address => bool)))
        private _daoRoleMembers;

    // Global roles to members; apply across all DAOs
    mapping(bytes32 => mapping(address => bool)) private _globalRoleMembers;

    event GrantDaoRole(
        uint256 indexed daoId,
        bytes32 indexed role,
        address indexed account
    );
    event GrantGlobalRole(bytes32 indexedrole, address indexed account);
    event RevokeDaoRole(
        uint256 indexed daoId,
        bytes32 indexed role,
        address indexed account
    );
    event RevokeGlobalRole(bytes32 indexed role, address indexed account);

    function hasGlobalRole(bytes32 role, address account)
        external
        view
        returns (bool)
    {
        return _globalRoleMembers[role][account];
    }

    function hasDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) external view returns (bool) {
        return _daoRoleMembers[daoId][role][account];
    }

    function _grantDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) internal {
        if (_hasDaoRole(daoId, role, account)) {
            revert(_revertMessageAlreadyHasDaoRole(daoId, role, account));
        }

        _daoRoleMembers[daoId][role][account] = true;
        emit GrantDaoRole(daoId, role, account);
    }

    function _grantGlobalRole(bytes32 role, address account) internal {
        if (_hasGlobalRole(role, account)) {
            revert(_revertMessageAlreadyHasGlobalRole(role, account));
        }

        _globalRoleMembers[role][account] = true;
        emit GrantGlobalRole(role, account);
    }

    function _revokeDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) internal {
        if (_isMissingDaoRole(daoId, role, account)) {
            revert(_revertMessageMissingDaoRole(daoId, role, account));
        }

        delete _daoRoleMembers[daoId][role][account];
        emit RevokeDaoRole(daoId, role, account);
    }

    function _revokeGlobalRole(bytes32 role, address account) internal {
        if (_isMissingGlobalRole(role, account)) {
            revert(_revertMessageMissingGlobalRole(role, account));
        }

        delete _globalRoleMembers[role][account];
        emit RevokeGlobalRole(role, account);
    }

    //slither-disable-next-line naming-convention
    function __RoleMembership_init() internal onlyInitializing {}

    function _hasDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) internal view returns (bool) {
        return _daoRoleMembers[daoId][role][account];
    }

    function _hasGlobalRole(bytes32 role, address account)
        internal
        view
        returns (bool)
    {
        return _globalRoleMembers[role][account];
    }

    function _isMissingDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) internal view returns (bool) {
        return !_daoRoleMembers[daoId][role][account];
    }

    function _isMissingGlobalRole(bytes32 role, address account)
        internal
        view
        returns (bool)
    {
        return !_globalRoleMembers[role][account];
    }

    /**
     * @dev Override for a custom revert message.
     */
    function _revertMessageAlreadyHasGlobalRole(bytes32 role, address account)
        internal
        view
        virtual
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    "RoleMembership: account ",
                    StringsUpgradeable.toHexString(uint160(account), 20),
                    " already has role ",
                    StringsUpgradeable.toHexString(uint256(role), 32)
                )
            );
    }

    /**
     * @dev Override the function for a custom revert message.
     */
    function _revertMessageAlreadyHasDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) internal view virtual returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "RoleMembership: account ",
                    StringsUpgradeable.toHexString(uint160(account), 20),
                    " already has role ",
                    StringsUpgradeable.toHexString(uint256(role), 32),
                    " in DAO ",
                    StringsUpgradeable.toHexString(daoId, 32)
                )
            );
    }

    /**
     * @dev Override the function for a custom revert message.
     */
    function _revertMessageMissingGlobalRole(bytes32 role, address account)
        internal
        view
        virtual
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    "RoleMembership: account ",
                    StringsUpgradeable.toHexString(uint160(account), 20),
                    " is missing role ",
                    StringsUpgradeable.toHexString(uint256(role), 32)
                )
            );
    }

    /**
     * @dev Override the function for a custom revert message.
     */
    function _revertMessageMissingDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) internal view virtual returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "RoleMembership: account ",
                    StringsUpgradeable.toHexString(uint160(account), 20),
                    " is missing role ",
                    StringsUpgradeable.toHexString(uint256(role), 32),
                    " in DAO ",
                    StringsUpgradeable.toHexString(daoId, 32)
                )
            );
    }
}
