// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./BaseTokenSweep.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/**
 * @title Adds the ability to sweep a token to a beneficiary address
 *
 * @dev
 */
abstract contract SweepERC20 is BaseTokenSweep {
    function sweepERC20Tokens(IERC20Upgradeable token, uint256 amount)
        external
        virtual
    {
        require(address(token) != address(this), "SweepERC20: self-transfer");
        require(address(token) != address(0), "SweepERC20: null-token");

        bool result = token.transfer(beneficiary, amount);
        require(result, "SweepERC20: transfer failed");
    }
}
