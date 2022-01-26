// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "../token/SweepERC20.sol";

contract SweepERC20TokensHarness is SweepERC20 {
    function upgradeTo(address) public {
        // blank
    }
}
