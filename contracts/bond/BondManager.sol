// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "./BondAccessControl.sol";
import "./BondCurator.sol";
import "./CollateralWhitelist.sol";
import "./Roles.sol";
import "./SingleCollateralBond.sol";
import "../Version.sol";

/**
 * @title Manages interactions with Bond contracts.
 *
 * @notice A central place to discover created Bonds and apply access control.
 *
 * @dev Owns of all Bonds it manages, guarding function accordingly allows finer access control to be provided.
 */
contract BondManager is
    BondAccessControl,
    BondCurator,
    PausableUpgradeable,
    UUPSUpgradeable,
    Version
{
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    EnumerableSetUpgradeable.AddressSet private _bonds;

    function addBond(address bond)
        external
        override
        whenNotPaused
        onlyRole(Roles.BOND_AGGREGATOR)
    {
        require(!_bonds.contains(bond), "BondManager: already managing");

        emit AddBond(bond);

        require(
            OwnableUpgradeable(bond).owner() == address(this),
            "BondManager: not bond owner"
        );

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
        whenNotPaused
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
        __BondAccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    /**
     * @notice Pauses most side affecting functions.
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
