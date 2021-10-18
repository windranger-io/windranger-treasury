// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.9;

import '@openzeppelin/contracts/utils/Context.sol';
import "./ETHVault.sol";
import "./ERC20Vault.sol";
import "./ERC721Vault.sol";

/**
 * @title Treasury is where the valuables are kept.
 *
 * @dev
 */
contract Treasury is Context, ETHVault, ERC20Vault, ERC721Vault {


}