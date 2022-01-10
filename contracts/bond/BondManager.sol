// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./CollateralWhitelist.sol";
import "./BondCurator.sol";
import "./Roles.sol";
import "./SingleCollateralBond.sol";

interface OwnableUpgradeable {
    function owner() external returns (address);
}

/**
 * @title Manages interactions with Bond contracts.
 *
 * @notice A central place to discover created Bonds and apply access control.
 *
 * @dev Owns of all Bonds it manages, guarding function accordingly allows finer access control to be provided.
 */
contract BondManager is
    AccessControlUpgradeable,
    BondCurator,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    EnumerableSetUpgradeable.AddressSet private _bonds;

    event AddBond(address bond);

    function addBond(address bond)
        external
        override
        whenNotPaused
        onlyRole(Roles.BOND_AGGREGATOR)
    {
        require(!_bonds.contains(bond), "BondManager: already managing");
        require(
            OwnableUpgradeable(bond).owner() == address(this),
            "BondManager: not bond owner"
        );

        emit AddBond(bond);

        bool added = _bonds.add(bond);
        require(added, "BondManager: failed to add");
    }

    function bondAllowRedemption(address bond)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).allowRedemption();
    }

    function bondDeposit(address bond, uint256 amount) external whenNotPaused {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).deposit(amount);
    }

    function bondPause(address bond)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).pause();
    }

    function bondSlash(address bond, uint256 amount)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).slash(amount);
    }

    function bondSetMetaData(address bond, string calldata data)
        external
        onlyRole(Roles.BOND_ADMIN)
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).setMetaData(data);
    }

    function bondSetTreasury(address bond, address replacement)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).setTreasury(replacement);
    }

    function bondUnpause(address bond)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).unpause();
    }

    function bondWithdrawCollateral(address bond)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).withdrawCollateral();
    }

    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     */
    function initialize() external virtual initializer {
        __AccessControl_init();
        __Pausable_init();

        _setRoleAdmin(Roles.BOND_ADMIN, Roles.DAO_ADMIN);
        _setRoleAdmin(Roles.BOND_AGGREGATOR, Roles.DAO_ADMIN);
        _setRoleAdmin(Roles.SYSTEM_ADMIN, Roles.DAO_ADMIN);
        _setupRole(Roles.DAO_ADMIN, _msgSender());
        _setupRole(Roles.SYSTEM_ADMIN, _msgSender());
        _setupRole(Roles.BOND_ADMIN, _msgSender());
        _setupRole(Roles.BOND_AGGREGATOR, _msgSender());
    }

    /**
     * @notice Pauses most side affecting functions.
     *
     * @dev The ony side effecting (non view or pure function) function exempt from pausing is expire().
     */
    function pause() external whenNotPaused onlyRole(Roles.BOND_ADMIN) {
        _pause();
    }

    /**
     * @notice Resumes all paused side affecting functions.
     */
    function unpause() external whenPaused onlyRole(Roles.BOND_ADMIN) {
        _unpause();
    }

    function bondAt(uint256 index) external view returns (address) {
        require(
            index < EnumerableSetUpgradeable.length(_bonds),
            "BondManager: too large"
        );

        return EnumerableSetUpgradeable.at(_bonds, index);
    }

    function bondCount() external view returns (uint256) {
        return EnumerableSetUpgradeable.length(_bonds);
    }

    /**
     * @notice Permits only the owner to perform proxy upgrades.
     *
     * @dev Only applicable when deployed as implementation to a UUPS proxy.
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(Roles.SYSTEM_ADMIN)
    {}

    function _requireManagingBond(address bond) private view {
        require(_bonds.contains(bond), "BondManager: not managing");
    }
}
