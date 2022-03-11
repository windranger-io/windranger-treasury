// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/**
 * @title Role based set membership.
 *
 * @notice Encapsulation of tracking, management and validation of role membership of addresses.
 *
 * There are two distinct classes of roles:
 * - Global; without scope limit.
 * - Dao; membership scoped to that of the key (uint256).
 *
 * @dev Meaningful application of role membership is expected to come from derived contracts.
 *      e.g. access control.
 */
abstract contract RoleMembership is Initializable {
    // TODO collapse the Role
    struct Role {
        mapping(address => bool) members;
    }

    // Roles that apply in DAOs individually
    mapping(uint256 => mapping(bytes32 => Role)) private _daoRoles;

    // Roles that apply across all DAOs
    mapping(bytes32 => Role) private _globalRoles;

    event GrantDaoRole(uint256 daoId, bytes32 role, address account);
    event GrantGlobalRole(bytes32 role, address account);
    event RevokeDaoRole(uint256 daoId, bytes32 role, address account);
    event RevokeGlobalRole(bytes32 role, address account);

    function hasGlobalRole(bytes32 role, address account)
        public
        view
        returns (bool)
    {
        return _globalRoles[role].members[account];
    }

    function hasDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) public view returns (bool) {
        return _daoRoles[daoId][role].members[account];
    }

    function _grantDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) internal {
        require(
            _isMissingDaoRole(daoId, role, account),
            "AccessControl: has role"
        );

        _daoRoles[daoId][role].members[account] = true;
        emit GrantDaoRole(daoId, role, account);
    }

    function _grantGlobalRole(bytes32 role, address account) internal {
        require(_isMissingGlobalRole(role, account), "AccessControl: has role");

        _globalRoles[role].members[account] = true;
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

        delete _daoRoles[daoId][role].members[account];
        emit RevokeDaoRole(daoId, role, account);
    }

    function _revokeGlobalRole(bytes32 role, address account) internal {
        if (_isMissingGlobalRole(role, account)) {
            revert(_revertMessageMissingGlobalRole(role, account));
        }

        delete _globalRoles[role].members[account];
        emit RevokeGlobalRole(role, account);
    }

    //slither-disable-next-line naming-convention
    function __DaoAccessControl_init() internal onlyInitializing {}

    function _isMissingDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) internal view returns (bool) {
        return !_daoRoles[daoId][role].members[account];
    }

    function _isMissingGlobalRole(bytes32 role, address account)
        internal
        view
        returns (bool)
    {
        return !_globalRoles[role].members[account];
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
                    "AccessControl: account ",
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
                    "AccessControl: account ",
                    StringsUpgradeable.toHexString(uint160(account), 20),
                    " is missing role ",
                    StringsUpgradeable.toHexString(uint256(role), 32),
                    " in DAO ",
                    StringsUpgradeable.toHexString(daoId, 32)
                )
            );
    }
}
