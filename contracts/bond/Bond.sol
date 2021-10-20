// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title Bond contract that issues debt tokens in exchange for a security.
 *
 * @dev A single token type is held by the contract as security.
 */
contract Bond is Context, ERC20 {
    event Deposit(address depositor, uint256 amount);
    event DebtCertificate(address receiver, uint256 amount);

    IERC20 private _securityToken;

    constructor(
        string memory name,
        string memory symbol,
        address securityToken
    ) ERC20(name, bond) {
        _securityToken = IERC20(securityToken);
    }

    /**
     * @dev This contract must have been approved to transfer the given amount from the ERC20 token being used as security.
     */
    function deposit(uint256 amount) external {
        require(amount <= totalSupply(), "Bond:deposit:Deposit too large");
        address sender = _msgSender();

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _securityToken.transferFrom(
            sender,
            address(this),
            amount
        );
        require(transferred, "Bond::deposit:Security transfer failed");
        emit Deposit(sender, amount);

        transfer(sender, amount);
        emit DebtCertificate(sender, amount);
    }

    //TODO override the mint operation with access control

    //TODO redeem - use increaseAllowance
    //TODO slash
}
