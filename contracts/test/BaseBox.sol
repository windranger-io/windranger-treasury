// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title An upgradable storage box for a string.
 *
 * @notice The storage box can store a single string value, emit an event and also retrieve the stored value.
 *
 * @dev Event emitted on storing the value.
 */
abstract contract BaseBox is OwnableUpgradeable, UUPSUpgradeable {
    string private _value;

    event Store(string value);

    /**
     * @notice Permits the owner to store a value.
     *
     * @dev storing the value causes the Store event to be emitted, overwriting any previously stored value.
     *
     * @param boxValue value for storage in the Box, no restrictions.
     */
    function store(string calldata boxValue) external onlyOwner {
        _value = boxValue;

        emit Store(_value);
    }

    /**
     * @notice retrieves the stored value.
     *
     * @dev the Box stores only a single value.
     *
     * @return store value, which could be uninitialized.
     */
    function value() external view returns (string memory) {
        return _value;
    }

    /**
     * @notice An initializer instead of a constructor.
     *
     * @dev Compared to a constructor, an init adds deployment cost (as constructor code is executed but not deployed).
     *      However when used in conjunction with a proxy, the init means the contract can be upgraded.
     */
    function initialize() public virtual initializer {}

    /**
     * @notice Permits only the owner to perform proxy upgrades.
     *
     * @dev Only applicable when deployed as implementation to a UUPS proxy.
     */
    function _authorizeUpgrade(address newImplementation) internal override {}
}
