// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TokenSweep.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/**
 * @title Adds the ability to sweep ERC20 tokens to a beneficiary address
 */
abstract contract SweepERC20 is TokenSweep {
    event ERC20Sweep(
        address indexed beneficiary,
        address indexed tokens,
        uint256 amount,
        address indexed instigator
    );

    /**
     * @notice Sweep the erc20 tokens to the beneficiary address
     *
     * @param tokens The registry for the ERC20 token to transfer,
     * @param amount How many tokens, in the ERC20's decimals to transfer.
     **/
    function _sweepERC20Tokens(address tokens, uint256 amount) internal {
        require(tokens != address(this), "SweepERC20: self transfer");
        require(tokens != address(0), "SweepERC20: address zero");

        emit ERC20Sweep(tokenSweepBeneficiary(), tokens, amount, _msgSender());

        bool result = IERC20Upgradeable(tokens).transfer(
            tokenSweepBeneficiary(),
            amount
        );
        require(result, "SweepERC20: transfer failed"); //
    }
}
