// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.9;

import "./ETHVault.sol";
import "./ERC20Vault.sol";
import "./ERC721Vault.sol";

/**
 * @title Treasury is where the valuables are kept.
 *
 * @dev
 */
contract Treasury is ETHVault, ERC20Vault, ERC721Vault {


}