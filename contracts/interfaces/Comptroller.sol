// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.9;

/**
 * @title Comtroller orchestrates the elements for a functioning Treasury with access control and reporting.
 *
 * @dev
 */
interface Comproller {

    //TODO each vault must be unique in their responsible asset - use mapping with a enum key of asset types
    event Deposit(address from, uint256 amount);
    event Withdraw(address from, uint256 amount);
}