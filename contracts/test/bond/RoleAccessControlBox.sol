// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../RoleAccessControl.sol";

/**
 * @title Box to test the access control dedicated for the Bond family of contracts.
 *
 * @notice An empty box for testing the provided modifiers and management for access control required throughout the Bond contracts.
 */
contract BondAccessControlBox is RoleAccessControl {
    /**
     * As BondAccessControl is intended to be used in Upgradable contracts, it uses an init.
     */
    constructor() initializer {
        __RoleAccessControl_init();
    }
}
