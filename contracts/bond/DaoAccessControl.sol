// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

// TODO not useful, needs the roles setup in child
// TODO enforcement of role admins in child
/**
 * @title
 *
 * @notice
 *
 * @dev
 */
abstract contract DaoAccessControl is Initializable {
    struct Role {
        mapping(address => bool) members;
    }

    // Roles that apply in DAOs individually
    mapping(uint256 => mapping(bytes32 => Role)) private _daoRoles;

    // Roles that apply across all DAOs
    mapping(bytes32 => Role) private _globalRoles;

    event AddDaoRoleAdmin(uint256 daoId, bytes32 role, bytes32 adminRole);
    event AddGlobalRoleAdmin(bytes32 role, bytes32 adminRole);
    event GrantDaoRole(uint256 daoId, bytes32 role, address account);
    event GrantGlobalRole(bytes32 role, address account);
    event RemoveDaoRoleAdmin(uint256 daoId, bytes32 role, bytes32 adminRole);
    event RemoveGlobalRoleAdmin(bytes32 role, bytes32 adminRole);
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
        require(
            hasDaoRole(daoId, role, account),
            "AccessControl: missing role"
        );

        delete _daoRoles[daoId][role].members[account];
        emit RevokeDaoRole(daoId, role, account);
    }

    //TODO custom message - say which role they're missing
    function _revokeGlobalRole(bytes32 role, address account) internal {
        require(hasGlobalRole(role, account), "AccessControl: missing role");

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

    /**
     * @dev Revert with a standard message if `account` is missing the global `role`.
     */
    function _checkGlobalRole(bytes32 role, address account) private view {
        if (_isMissingGlobalRole(role, account)) {
            revert(_revertMessageMissingGlobalRole(role, account));
        }
    }

    /**
     * @dev Revert with a standard message if `account` is missing the `role` within the DAO.
     */
    function _checkDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) private view {
        if (!hasDaoRole(daoId, role, account)) {
            revert(_revertMessageMissingDaoRole(daoId, role, account));
        }
    }
}
