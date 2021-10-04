// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/Treasury.sol";

/**
 * @title Treasury for a single ERC20 token type.
 *
 * @dev
 */
interface ERC20Treasury is Treasury, Ownable {

    function deposit(uint256 amount) public onlyOwner {
        //TODO contact the ERC20 contract and transfer
        //TODO emit transfer in event
    }

    function withdraw(address destination, uint256 amount) public onlyOwner {
        //TODO check balance, maybe do that elsewhere?
        //TODO contract the ERC20 contract and transfer
        //TODO emit transfer out event
    }
}
