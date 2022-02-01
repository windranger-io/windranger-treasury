// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Box.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MockUpgradedVersion {
    string public constant VERSION = "mock_tag";
}

/**
 * Contract adding a variable create a unique contract, that a Box may be upgraded as.
 */
contract BoxExtension is BaseBox, MockUpgradedVersion {
    uint256 private _difference;

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
