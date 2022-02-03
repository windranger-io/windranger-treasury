// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Box.sol";

contract MockUpgradedVersion {
    string public constant VERSION = "mock_tag";
}

contract VeryLongVersionTag {
    // ascii chars in UFT-8 encoding take 1 byte. We want a tag that has > 256 bits * 2 = 64 bytes long => 65 ascii chars
    string public constant VERSION =
        "blahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahb"; // 65 chars long
}

/**
 * Contract adding a variable create a unique contract, that a Box may be upgraded as.
 */
contract BoxExtension is BaseBox, MockUpgradedVersion {

}

contract BoxExtensionWithVeryLongVersionTag is BaseBox, VeryLongVersionTag {}
