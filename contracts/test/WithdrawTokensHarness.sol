// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "../token/WithdrawTokens.sol";

contract WithdrawTokensHarness is WithdrawTokens {
    constructor(address _owner) WithdrawTokens(_owner) {}
}
