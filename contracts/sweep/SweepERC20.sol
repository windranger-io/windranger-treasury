// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TokenSweep.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/**
 * @title Adds the ability to sweep ERC20 tokens to a beneficiary address
 */
abstract contract SweepERC20 is TokenSweep {
    /**
     * @notice Sweep the erc20 tokens to the beneficiary address
     **/
    function _sweepERC20Tokens(address token, uint256 amount) internal {
        require(address(token) != address(this), "SweepERC20: self-transfer");
        require(address(token) != address(0), "SweepERC20: null-token");

        bool result = IERC20Upgradeable(token).transfer(_beneficiary, amount);
        require(result, "SweepERC20: transfer failed");
    }
}
