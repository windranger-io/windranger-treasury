// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "../interfaces/ETHDepositStrategy.sol";
import "../interfaces/ETHWithdrawStrategy.sol";

/**
 * @title Vault for a ETH.
 *
 * @dev
 */
contract ETHVault is Context {
    ETHDepositStrategy private depositStrategy;
    ETHWithdrawStrategy private withdrawStrategy;

    // Function to receive Ether. msg.data must be empty
    receive() external payable {
        //TODO call deposit
    }

    // Fallback function is called when msg.data is not empty
    fallback() external payable {
        //TODO call deposit
    }

    constructor(ETHDepositStrategy _deposit, ETHWithdrawStrategy _withdraw) {
        depositStrategy = _deposit;
        withdrawStrategy = _withdraw;
    }

    function deposit(uint256 amount) public payable {
        //TODO deposit strategy
        //TODO emit transfer in event
    }

    //TODO use call to send, with re-entry guard
    function withdraw(address payable to) public payable {
        //TODO use withdraw strategy

        // Call returns a boolean value indicating success or failure.
        (bool sent, bytes memory data) = to.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
    }
}
