// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "../token/SweepERC721.sol";

import "hardhat/console.sol";

contract SweepERC721TokensHarness is SweepERC721 {
    function initialize() external override {
        // blank
    }

    function upgradeTo(address) public override {
        // blank
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        view
        override
    {
        // blank
        console.log("implemented!", newImplementation);
    }
}
