// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.9;

import '@openzeppelin/contracts/utils/Context.sol';

/**
 * @title Vault for ERC-721 token types.
 *
 * @dev
 */
contract ERC721Vault is Context {

    function deposit(uint256 amount) public {
        //TODO either approve & transferFrom or Orcale sends in notifications on transfer events

        //TODO emit transfer in event
    }

    function withdraw(address destination, uint256 amount) public {
        //TODO check balance, maybe do that elsewhere?
        //TODO contract the ERC20 contract and transfer
        //TODO emit transfer out event
    }
}
