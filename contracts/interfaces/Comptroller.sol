// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.9;

/**
 * @title Comtroller orchestrates the elements for a functioning Treasury with access control and reporting.
 *
 * @dev
 */
interface Comproller {

    event Deposit(address from, uint256 amount);
    event Withdraw(address from, uint256 amount);
}