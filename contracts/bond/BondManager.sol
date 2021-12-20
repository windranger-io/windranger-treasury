// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./CollateralWhitelist.sol";
import "./BondCurator.sol";

/**
 * @title Manages interactions with Bond contracts.
 *
 * @notice A central place to discover created Bonds and apply access control.
 *
 * @dev Owns of all Bonds it manages, guarding function accordingly allows finer access control to be provided.
 */
contract BondManager is BondCurator, OwnableUpgradeable, UUPSUpgradeable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    EnumerableSetUpgradeable.AddressSet private _bonds;

    event AddBond(address bond);

    function addBond(address bond) external override {
        emit AddBond(bond);

        bool added = _bonds.add(bond);
        require(added, "BondManager: already present");

        require(
            OwnableUpgradeable(bond).owner() == address(this),
            "BondManager: not bond owner"
        );
    }

    function initialize() external virtual initializer {
        __Ownable_init();
    }

    function bondAt(uint256 index) external view returns (address) {
        require(
            EnumerableSetUpgradeable.length(_bonds) > index,
            "BondManager: too large"
        );

        return EnumerableSetUpgradeable.at(_bonds, index);
    }

    function bondCount() external view returns (uint256) {
        return EnumerableSetUpgradeable.length(_bonds);
    }

    //TODO proxy through bond operations

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
}
