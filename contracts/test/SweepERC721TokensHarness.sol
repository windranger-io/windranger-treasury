// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "../sweep/SweepERC721.sol";

contract SweepERC721TokensHarness is SweepERC721 {
    function _authorizeUpgrade(address newImplementation)
        internal
        view
        override
    {
        // blank
    }
}
