// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Bond contract that issues debt tokens in exchange for a security.
 *
 * @dev A single token type is held by the contract as security.
 */
contract Bond is Context, ERC20 {
    event Deposit(address depositor, string symbol, uint256 amount);
    event DebtCertificate(address receiver, string symbol, uint256 amount);
    event Redemption(address redeemer, string symbol, uint256 amount);

    IERC20Metadata private _securityToken;
    bool private _isRedemptionAllowed;

    /**
     * @dev Modifier to make a function callable only when the contract is not redeemable.
     *
     * Requirements:
     * - The contract must not be redeemable.
     */
    modifier whenNotRedeemable() {
        require(!_isRedemptionAllowed, "Bond::whenNotRedeemable: redeemable");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is redeemable.
     *
     * Requirements:
     * - The contract must be redeemable.
     */
    modifier whenRedeemable() {
        require(_isRedemptionAllowed, "Bond::whenRedeemable: not redeemable");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address securityToken
    ) ERC20(name, bond) {
        _securityToken = IERC20(securityToken);
        _isRedemptionAllowed = false;
    }

    /**
     * @dev This contract must have been approved to transfer the given amount from the ERC20 token being used as security.
     */
    function deposit(uint256 amount) external {
        require(amount <= totalSupply(), "Bond:deposit: Deposit too large");
        address sender = _msgSender();

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _securityToken.transferFrom(
            sender,
            address(this),
            amount
        );
        require(transferred, "Bond::deposit: Security transfer failed");
        emit Deposit(sender, _securityToken.symbol(), amount);

        transfer(sender, amount);
        emit DebtCertificate(sender, symbol(), amount);
    }

    //TODO access control - only who? - BondFactory as part of init
    function mint(uint256 amount) external {
        _mint(address(this), amount);
    }

    //TODO access control - bitdaoadmin
    function allowRedemption() external whenNotRedeemable {
        _isRedemptionAllowed = true;
    }

    //TODO access control - bitdaoadmin
    function slash(uint256 amount) external {
        require(
            totalSupply() >= amount,
            "Bond::slash: Amount greater than total supply"
        );

        //TODO partial slashing
        //TODO calc percentage and apply to each holder
    }

    function redeem(uint256 amount) external whenRedeemable {
        address sender = _msgSender();

        require(
            balanceOf(sender) >= amount,
            "Bond:redeem: too few debt tokens"
        );
        _burn(sender, amount);

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _securityToken.transfer(sender, amount);
        require(transferred, "Bond::redeem: Security transfer failed");
        emit Redemption(sender, _securityToken.symbol(), amount);
    }
}
