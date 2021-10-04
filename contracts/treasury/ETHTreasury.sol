// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.9;

import "../interfaces/Treasury.sol";

/**
 * @title Treasury for a ETH.
 *
 * @dev
 */
interface ETHTreasury is Treasury {

    //TODO need to implement receive & fall back for ETH :. can't use a common deposit method

    function deposit(uint256 amount) public onlyOwner {
        //TODO emit transfer in event
    }

    function withdraw(address payable destination, uint256 amount) public onlyOwner {
        //TODO check balance, maybe do that elsewhere?
        //TODO use the OpenZepplin Address for transfer
        //TODO emit transfer out event
    }
}
