// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "../token/SweepERC20.sol";

contract SweepERC20TokensHarness is SweepERC20 {
    function initialize() external override {
        // blank
    }

    function upgradeTo(address) public override {
        // blank
    }

    function _authorizeUpgrade(address newImplementation) internal override {
        // blank
    }
}
