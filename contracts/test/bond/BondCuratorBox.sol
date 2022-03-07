// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../bond/BondCurator.sol";

/**
 * @title Box to test the Bond curator abstract contract.
 *
 * @notice An empty box for testing the provided functions required in management of Bonds.
 */
contract BondCuratorBox is BondCurator {
    function initialize() external initializer {
        __BondCurator_init();
    }

    function addBond(uint256 daoId, address bond) external {
        _addBond(daoId, bond);
    }
}
