// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "./BondAccessControl.sol";
import "./BondCurator.sol";
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

    mapping(uint256 => EnumerableSetUpgradeable.AddressSet) private _bonds;

    function addBond(uint256 daoId, address bond)
        external
        override
        whenNotPaused
        onlyRole(Roles.BOND_AGGREGATOR)
    {
        require(!_bonds[daoId].contains(bond), "BondManager: already managing");

        emit AddBond(daoId, bond);

        require(
            OwnableUpgradeable(bond).owner() == address(this),
            "BondManager: not bond owner"
        );

        bool added = _bonds[daoId].add(bond);
        require(added, "BondManager: failed to add");
    }

    function bondAllowRedemption(uint256 daoId, address bond)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _requireManagingBond(daoId, bond);

        SingleCollateralBond(bond).allowRedemption();
    }

    function bondPause(uint256 daoId, address bond)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _requireManagingBond(daoId, bond);

        SingleCollateralBond(bond).pause();
    }

    function bondSlash(
        uint256 daoId,
        address bond,
        uint256 amount
    ) external whenNotPaused onlyRole(Roles.BOND_ADMIN) {
        _requireManagingBond(daoId, bond);

        SingleCollateralBond(bond).slash(amount);
    }

    function bondSetMetaData(
        uint256 daoId,
        address bond,
        string calldata data
    ) external whenNotPaused onlyRole(Roles.BOND_ADMIN) {
        _requireManagingBond(daoId, bond);

        SingleCollateralBond(bond).setMetaData(data);
    }

    function bondSetTreasury(
        uint256 daoId,
        address bond,
        address replacement
    ) external whenNotPaused onlyRole(Roles.BOND_ADMIN) {
        _requireManagingBond(daoId, bond);

        SingleCollateralBond(bond).setTreasury(replacement);
    }

    function bondUnpause(uint256 daoId, address bond)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _requireManagingBond(daoId, bond);

        SingleCollateralBond(bond).unpause();
    }

    function bondWithdrawCollateral(uint256 daoId, address bond)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _requireManagingBond(daoId, bond);

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

    function bondAt(uint256 daoId, uint256 index)
        external
        view
        returns (address)
    {
        require(
            index < EnumerableSetUpgradeable.length(_bonds[daoId]),
            "BondManager: too large"
        );

        return EnumerableSetUpgradeable.at(_bonds[daoId], index);
    }

    function bondCount(uint256 daoId) external view returns (uint256) {
        return EnumerableSetUpgradeable.length(_bonds[daoId]);
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

    function _requireManagingBond(uint256 daoId, address bond) private view {
        require(_bonds[daoId].contains(bond), "BondManager: not managing");
    }
}
