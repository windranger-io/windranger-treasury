// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./CollateralWhitelist.sol";
import "./BondCurator.sol";
import "./SingleCollateralBond.sol";

/**
 * @title Manages interactions with Bond contracts.
 *
 * @notice A central place to discover created Bonds and apply access control.
 *
 * @dev Owns of all Bonds it manages, guarding function accordingly allows finer access control to be provided.
 */
contract BondManager is
    BondCurator,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    EnumerableSetUpgradeable.AddressSet private _bonds;

    event AddBond(address bond);

    //TODO add permission guard - need to figure out single control model across three contracts
    function addBond(address bond) external override whenNotPaused {
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
        onlyOwner
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).allowRedemption();
    }

    function bondDeposit(address bond, uint256 amount) external whenNotPaused {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).deposit(amount);
    }

    function bondPause(address bond) external whenNotPaused onlyOwner {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).pause();
    }

    function bondSlash(address bond, uint256 amount)
        external
        whenNotPaused
        onlyOwner
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).slash(amount);
    }

    function bondSetMetaData(address bond, string calldata data)
        external
        onlyOwner
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).setMetaData(data);
    }

    function bondSetTreasury(address bond, address replacement)
        external
        whenNotPaused
        onlyOwner
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).setTreasury(replacement);
    }

    function bondUnpause(address bond) external whenNotPaused onlyOwner {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).unpause();
    }

    function bondWithdrawCollateral(address bond)
        external
        whenNotPaused
        onlyOwner
    {
        _requireManagingBond(bond);

        SingleCollateralBond(bond).withdrawCollateral();
    }

    function initialize() external virtual initializer {
        __Ownable_init();
        __Pausable_init();
    }

    /**
     * @notice Pauses most side affecting functions.
     *
     * @dev The ony side effecting (non view or pure function) function exempt from pausing is expire().
     */
    function pause() external whenNotPaused onlyOwner {
        _pause();
    }

    /**
     * @notice Resumes all paused side affecting functions.
     */
    function unpause() external whenPaused onlyOwner {
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
        onlyOwner
    {}

    function _requireManagingBond(address bond) private view {
        require(_bonds.contains(bond), "BondManager: not managing");
    }
}
