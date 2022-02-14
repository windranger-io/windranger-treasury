// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../bond/BondAccessControl.sol";

/**
 * @title Box to test the access control dedicated for the Bond family of contracts.
 *
 * @notice An empty box for testing the provided modifiers and management for access control required throughout the Bond contracts.
 */
contract BondAccessControlBox is BondAccessControl {
    /**
     * As BondAccessControl is intended to be used in Upgradable contracts, it uses an init.
     */
    constructor() initializer {
        __BondAccessControl_init();
    }
}
