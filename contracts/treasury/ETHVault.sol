// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.9;


/**
 * @title Vault for a ETH.
 *
 * @dev
 */
contract ETHVault {

    //TODO need to implement receive & fall back for ETH :. can't use a common deposit method

    function deposit(uint256 amount) public {
        //TODO emit transfer in event
    }

    function withdraw(address payable destination, uint256 amount) public {
        //TODO check balance, maybe do that elsewhere?
        //TODO use the OpenZepplin Address for transfer
        //TODO emit transfer out event
    }
}
