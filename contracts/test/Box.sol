// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

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

}
