// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "../sweep/SweepERC20.sol";

contract SweepERC20TokensHarness is SweepERC20 {
    function _authorizeUpgrade(address newImplementation) internal override {
        // blank
    }
}
