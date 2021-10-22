// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Bond contract that issues debt tokens in exchange for a security.
 *
 * @dev A single token type is held by the contract as security.
 */
contract Bond is Context, ERC20, Ownable, Pausable {
    event DebtCertificate(address receiver, string symbol, uint256 amount);
    event Deposit(address depositor, string symbol, uint256 amount);
    event Redemption(address redeemer, string symbol, uint256 amount);
    event Slash(string symbol, uint256 amount);

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

    /// Multiplier / divider for four decimal places, used in redemption ratio calculation.
    uint256 private constant DECIMAL_OFFSET = 10000;

    IERC20Metadata private immutable _securityToken;
    address private _treasury;
    bool private _isRedemptionAllowed;

    constructor(
        string memory name,
        string memory symbol,
        address securityToken,
        address treasury
    ) ERC20(name, symbol) {
        _securityToken = IERC20Metadata(securityToken);
        _isRedemptionAllowed = false;
        _treasury = treasury;
    }

    /**
     * @dev Debt certificates are not allowed to be redeemed before the owner gives their permission.
     */
    function allowRedemption()
        external
        whenNotPaused
        whenNotRedeemable
        onlyOwner
    {
        _isRedemptionAllowed = true;
    }

    /**
     * @dev This contract must have been approved to transfer the given amount from the ERC20 token being used as security.
     */
    function deposit(uint256 amount) external whenNotPaused {
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

    /**
     * @dev Creates additional debt tokens, inflating the supply, which without additional deposits affects the redemption ratio.
     */
    function mint(uint256 amount) external whenNotPaused onlyOwner {
        _mint(address(this), amount);
    }

    /**
     * @dev Pauses contract, preventing operation of all external Bond functions that are not simple accessors.
     */
    function pause() external whenNotPaused onlyOwner {
        _pause();
    }

    /**
     * @dev Converts the amount of debt certificates owned by the sender, at the exchange ratio to the security asset.
     */
    function redeem(uint256 amount) external whenNotPaused whenRedeemable {
        address sender = _msgSender();

        require(
            balanceOf(sender) >= amount,
            "Bond:redeem: too few debt tokens"
        );
        _burn(sender, amount);

        // Unknown ERC20 token behaviour, cater for bool usage
        uint256 redemptionAmount = _redemptionAmount(amount);
        bool transferred = _securityToken.transfer(sender, redemptionAmount);
        require(transferred, "Bond::redeem: Security transfer failed");

        emit Redemption(sender, _securityToken.symbol(), redemptionAmount);
    }

    /**
     * @dev Resumes / unpauses contract, allowing operation of all external functions.
     */
    function resume() external whenPaused onlyOwner {
        _pause();
    }

    /**
     * The amount of debt certificates remains the same. Slashing reduces the security tokens, so each debt token
     * is redeemable for fewer securities.
     *
     * @dev Transfers the amount to the Bond owner, reducing the amount available for later redemption (redemption ratio).
     */
    function slash(uint256 amount)
        external
        whenNotPaused
        whenNotRedeemable
        onlyOwner
    {
        uint256 securities = _securityToken.balanceOf(address(this));
        require(
            securities >= amount,
            "Bond::slash: Amount greater than available security supply"
        );

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _securityToken.transfer(_treasury, amount);
        require(transferred, "Bond::slash: Security transfer failed");

        emit Slash(_securityToken.symbol(), amount);
    }

    /**
     * @dev Retrieves the address that receives any slashed funds.this
     */
    function treasury() external view returns (address) {
        return _treasury;
    }

    /**
     * @dev Permits the owner to update the treasury address, recipient of any slashed funds.
     */
    function treasury(address treasury) external whenNotPaused onlyOwner {
        _treasury = treasury;
    }

    /**
     * @dev Securities are deposited at a 1 to 1 ratio, however slashing can change that.
     */
    function _redemptionAmount(uint256 amount) internal view returns (uint256) {
        uint256 securities = _securityToken.balanceOf(address(this));

        if (securities == totalSupply()) {
            return amount;
        } else {
            uint256 redemptionRatio = (DECIMAL_OFFSET * securities) /
                totalSupply();
            return (redemptionRatio * amount) / DECIMAL_OFFSET;
        }
    }
}
