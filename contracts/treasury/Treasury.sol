// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "./ETHVault.sol";
import "./ERC20Vault.sol";
import "./ERC721Vault.sol";

/**
 * @title Treasury is where the valuables are kept.
 *
 * @dev
 */
contract Treasury is Context, ETHVault, ERC20Vault, ERC721Vault {

    constructor(ETHDepositStrategy depositETH, ETHWithdrawStrategy withdrawETH, ERC20DepositStrategy depositERC20, ERC20WithdrawStrategy withdrawERC20, ERC721DepositStrategy depositERC721, ERC721WithdrawStrategy withdrawERC721) ETHVault(depositETH,withdrawETH) ERC20Vault(depositERC20,withdrawERC20) ERC721Vault(depositERC721, withdrawERC721) {}
}
