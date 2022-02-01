// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "../Version.sol";
import "./BaseBox.sol";

/**
 * @title An upgradable storage box for a string.
 *
 * @notice The storage box can store a single string value, emit an event and also retrieve the stored value.
 *
 * @dev Event emitted on storing the value.
 */
contract Box is BaseBox, Version {
    /**
     * @notice An initializer instead of a constructor.
     *
     * @dev Compared to a constructor, an init adds deployment cost (as constructor code is executed but not deployed).
     *      However when used in conjunction with a proxy, the init means the contract can be upgraded.
     */
    function initialize() public virtual initializer {
        __Ownable_init();
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
}
