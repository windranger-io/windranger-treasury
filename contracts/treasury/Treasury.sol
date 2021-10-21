// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "./ETHTreasury.sol";
import "./ERC20Treasury.sol";
import "./ERC721Treasury.sol";

/**
 * @title Treasury is where the valuables are kept.
 *
 * @dev
 */
contract Treasury is Context, ETHTreasury, ERC20Treasury, ERC721Treasury {
    constructor(
        ETHDepositStrategy depositETH,
        ETHWithdrawStrategy withdrawETH,
        ERC20DepositStrategy depositERC20,
        ERC20WithdrawStrategy withdrawERC20,
        ERC721DepositStrategy depositERC721,
        ERC721WithdrawStrategy withdrawERC721
    )
        ETHTreasury(depositETH, withdrawETH)
        ERC20Treasury(depositERC20, withdrawERC20)
        ERC721Treasury(depositERC721, withdrawERC721)
    {}
}
