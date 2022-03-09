pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

// TODO doco

// TODO not useful, needs the roles setup in child
abstract contract DaoAccessControl is Initializable, ContextUpgradeable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.Bytes32Set;

    struct Role {
        EnumerableSetUpgradeable.Bytes32Set adminRoles;
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

    /**
     * @notice Modifier for enforcing that an account has a specific global role
     *
     * @dev Reverts with a standardized message including the required role.
     */
    modifier onlyGlobalRole(bytes32 role) {
        _checkGlobalRole(role, _msgSender());
        _;
    }

    /**
     * @notice Modifier for enforcing that an account has a specific DAO role
     *
     * @dev Reverts with a standardized message including the required role.
     */
    modifier onlyDaoRole(uint256 daoId, bytes32 role) {
        _checkDaoRole(daoId, role, _msgSender());
        _;
    }

    /**
     * @notice The set of admin roles for a DAO role.
     *
     * @dev
     * WARNING: This operation will copy the entire storage to memory, which could be very expensive.
     * Provided to be used by view accessors that are queried without any gas fees.
     * Developers should keep in mind that this function has an unbounded cost, as part of a state-changing function it
     * may render that function uncallable if the set grows to a point where copying to memory consumes too much gas
     * to fit in a block.
     */
    function allDaoRoleAdmins(uint256 daoId, bytes32 role)
        external
        view
        returns (bytes32[] memory)
    {
        return _daoRoles[daoId][role].adminRoles.values();
    }

    /**
     * @notice The set of admin roles for a global role.
     *
     * @dev
     * WARNING: This operation will copy the entire storage to memory, which could be very expensive.
     * Provided to be used by view accessors that are queried without any gas fees.
     * Developers should keep in mind that this function has an unbounded cost, as part of a state-changing function it
     * may render that function uncallable if the set grows to a point where copying to memory consumes too much gas
     * to fit in a block.
     */
    function allGlobalRoleAdmins(bytes32 role)
        external
        view
        returns (bytes32[] memory)
    {
        return _globalRoles[role].adminRoles.values();
    }

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
            "DaoAccessControl: has role"
        );

        _daoRoles[daoId][role].members[account] = true;
        emit GrantDaoRole(daoId, role, account);
    }

    function _grantGlobalRole(bytes32 role, address account) internal {
        require(
            _isMissingGlobalRole(role, account),
            "DaoAccessControl: has role"
        );

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
            "DaoAccessControl: missing role"
        );

        delete _daoRoles[daoId][role].members[account];
        emit RevokeDaoRole(daoId, role, account);
    }

    function _revokeGlobalRole(bytes32 role, address account) internal {
        require(hasGlobalRole(role, account), "DaoAccessControl: missing role");

        delete _globalRoles[role].members[account];
        emit RevokeGlobalRole(role, account);
    }

    function _addGlobalRoleAdmin(bytes32 role, bytes32 adminRole) internal {
        require(
            !_isGlobalRoleAdmin(role, adminRole),
            "DaoAccessControl: role member"
        );

        bool added = _globalRoles[role].adminRoles.add(adminRole);
        require(added, "DaoAccessControl: add failed");
        emit AddGlobalRoleAdmin(role, adminRole);
    }

    function _addDaoRoleAdmin(
        uint256 daoId,
        bytes32 role,
        bytes32 adminRole
    ) internal {
        require(
            !_isDaoRoleAdmin(daoId, role, adminRole),
            "DaoAccessControl: role member"
        );

        bool added = _daoRoles[daoId][role].adminRoles.add(adminRole);
        require(added, "DaoAccessControl: add failed");
        emit AddDoaRoleAdmin(daoId, role, adminRole);
    }

    function _removeGlobalRoleAdmin(bytes32 role, bytes32 adminRole) internal {
        require(
            _isGlobalRoleAdmin(role, adminRole),
            "DaoAccessControl: not present"
        );

        bool remove = _globalRoles[role].adminRoles.remove(adminRole);
        require(remove, "DaoAccessControl: remove failed");
        emit RemoveGlobalRoleAdmin(role, adminRole);
    }

    function _removeDaoRoleAdmin(
        uint256 daoId,
        bytes32 role,
        bytes32 adminRole
    ) internal {
        require(
            _isDaoRoleAdmin(daoId, role, adminRole),
            "DaoAccessControl: not present"
        );

        bool remove = _daoRoles[daoId][role].adminRoles.remove(adminRole);
        require(remove, "DaoAccessControl: remove failed");
        emit RemoveDoaRoleAdmin(daoId, role, adminRole);
    }

    //slither-disable-next-line naming-convention
    function __DaoAccessControl_init() internal onlyInitializing {}

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
                    "BondAccessControl: account ",
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
                    "BondAccessControl: account ",
                    StringsUpgradeable.toHexString(uint160(account), 20),
                    " is missing role ",
                    StringsUpgradeable.toHexString(uint256(role), 32),
                    " in DAO ",
                    StringsUpgradeable.toHexString(daoId, 32)
                )
            );
    }

    function _isGlobalRoleAdmin(bytes32 role, bytes32 adminRole)
        private
        view
        returns (bool)
    {
        return _globalRoles[role].adminRoles.contains(adminRole);
    }

    function _isDaoRoleAdmin(
        uint256 daoId,
        bytes32 role,
        bytes32 adminRole
    ) private view returns (bool) {
        return _daoRoles[daoId][role].adminRoles.contains(adminRole);
    }

    function _isMissingDaoRole(
        uint256 daoId,
        bytes32 role,
        address account
    ) private view returns (bool) {
        return !_daoRoles[daoId][role].members[account];
    }

    function _isMissingGlobalRole(bytes32 role, address account)
        private
        view
        returns (bool)
    {
        return !_globalRoles[role].members[account];
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
