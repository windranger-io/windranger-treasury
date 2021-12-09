// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
    @title A storage box for a string.
    @notice The storage box can store a single string value, emit an event and also retrieve the stored value.
    @dev Event emitted on storing the value.
 */
contract Box {
    string private _value;

    event Store(string value);

    /**
        @notice store the given value.
        @dev storing the value causes the Store event to be emitted, overwriting any previously stored value.
        @param boxValue_ value for storage in the Box, no restrictions.
     */
    function store(string calldata boxValue) external {
        _value = boxValue;

        emit Store(_value);
    }

    /**
        @notice retrieves the stored value.
        @dev the Box stores only a single value.
        @return store value, which could be uninitialized.
     */
    function value() external view returns (string memory) {
        return _value;
    }
}
