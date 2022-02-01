// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Box.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MockUpgradedVersion {
    string public constant VERSION = "mock_tag";
}

contract VeryLongVersionTag {
    string public constant VERSION =
        "blahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblah";
}

/**
 * Contract adding a variable create a unique contract, that a Box may be upgraded as.
 */
contract BoxExtension is BaseBox, MockUpgradedVersion {
    uint256 private _difference;
}

contract BoxExtensionWithVeryLongVersionTag is BaseBox, VeryLongVersionTag {
    uint256 private _difference;
}
