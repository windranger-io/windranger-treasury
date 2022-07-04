// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../performance-bonds/PerformanceBondCurator.sol";

/**
 * @title Box to test the PerformanceBond curator abstract contract.
 *
 * @notice An empty box for testing the provided functions required in management of PerformanceBond.
 */
contract BondCuratorBox is PerformanceBondCurator {
    function initialize() external initializer {
        __BondCurator_init();
    }

    function addBond(uint256 daoId, address bond) external {
        _addBond(daoId, bond);
    }
}
