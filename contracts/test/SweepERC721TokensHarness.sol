// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "../token/SweepERC721.sol";

contract SweepERC721TokensHarness is SweepERC721 {
    function initialize() external override {
        // blank
    }

    function upgradeTo(address) public {
        // blank
    }

    function _authorizeUpgrade(address newImplementation) internal override {}
}
