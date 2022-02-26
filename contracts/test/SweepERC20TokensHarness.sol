// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../sweep/SweepERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract SweepERC20TokensHarness is SweepERC20 {
    function setBeneficiary(address beneficiary) external {
        _setTokenSweepBeneficiary(beneficiary);
    }

    function sweepERC20Tokens(address token, uint256 amount) external {
        _sweepERC20Tokens(token, amount);
    }
}
