// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.9;

import '@openzeppelin/contracts/utils/Context.sol';

/**
 * @title Vault for a ETH.
 *
 * @dev
 */
contract ETHVault is Context {

    // Function to receive Ether. msg.data must be empty
    receive() external payable {
        //TODO call deposit
    }

    // Fallback function is called when msg.data is not empty
    fallback() external payable {
        //TODO call deposit
    }

    function deposit(uint256 amount) public payable {
        //TODO deposit strategy

        //TODO emit transfer in event
    }

    //TODO use call to send, with re-entry guard
    function withdraw(address payable _to) public payable {

        //TODO use withdraw strategy

        // Call returns a boolean value indicating success or failure.
        (bool sent, bytes memory data) = _to.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
    }
}
