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
    event AllowRedemption(address authorizer);
    event DebtCertificateIssue(
        address receiver,
        string debSymbol,
        uint256 debtAmount
    );
    event Deposit(
        address depositor,
        string securitySymbol,
        uint256 securityAmount
    );
    event Redemption(
        address redeemer,
        string debtSymbol,
        uint256 debtAmount,
        string securitySymbol,
        uint256 securityAmount
    );
    event Slash(string securitySymbol, uint256 securityAmount);

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
        string memory name_,
        string memory symbol_,
        address securityToken_,
        address treasury_
    ) ERC20(name_, symbol_) {
        _securityToken = IERC20Metadata(securityToken_);
        _isRedemptionAllowed = false;
        _treasury = treasury_;
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
        emit AllowRedemption(_msgSender());
    }

    /**
     * @dev This contract must have been approved to transfer the given amount from the ERC20 token being used as security.
     */
    function deposit(uint256 amount) external whenNotPaused whenNotRedeemable {
        require(amount > 0, "Bond::deposit: too small");
        require(amount <= totalSupply(), "Bond:deposit: too large");
        address sender = _msgSender();

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _securityToken.transferFrom(
            sender,
            address(this),
            amount
        );
        require(transferred, "Bond::deposit: security transfer failed");
        emit Deposit(sender, _securityToken.symbol(), amount);

        _transfer(address(this), sender, amount);
        emit DebtCertificateIssue(sender, symbol(), amount);
    }

    /**
     * @dev Creates additional debt tokens, inflating the supply, which without additional deposits affects the redemption ratio.
     */
    function mint(uint256 amount)
        external
        whenNotPaused
        whenNotRedeemable
        onlyOwner
    {
        require(amount > 0, "Bond::mint: too small");
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
        require(amount > 0, "Bond::redeem: too small");

        address sender = _msgSender();
        uint256 totalSupply = totalSupply();

        require(
            balanceOf(sender) >= amount,
            "Bond:redeem: too few debt tokens"
        );
        _burn(sender, amount);

        // Unknown ERC20 token behaviour, cater for bool usage
        uint256 redemptionAmount = _redemptionAmount(amount, totalSupply);
        bool transferred = _securityToken.transfer(sender, redemptionAmount);
        require(transferred, "Bond::redeem: security transfer failed");

        emit Redemption(
            sender,
            symbol(),
            amount,
            _securityToken.symbol(),
            redemptionAmount
        );
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
        require(amount > 0, "Bond::slash: too small");

        uint256 securities = _securityToken.balanceOf(address(this));
        require(
            securities >= amount,
            "Bond::slash: greater than available security supply"
        );

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _securityToken.transfer(_treasury, amount);
        require(transferred, "Bond::slash: security transfer failed");

        emit Slash(_securityToken.symbol(), amount);
    }

    /**
     * @dev Retrieves the address that receives any slashed funds.
     */
    function treasury() external view returns (address) {
        return _treasury;
    }

    /**
     * @dev Slashing can result in securities remaining after full redemption due to flooring.
     * After full redemption, the left over securities can be transferred to the treasury using close.
     */
    function close() external whenNotPaused whenRedeemable onlyOwner {
        require(
            totalSupply() == 0,
            "Bond::close: debt Certificates outstanding"
        );

        uint256 securities = _securityToken.balanceOf(address(this));
        require(securities > 0, "Bond::close: no securities remain");

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _securityToken.transfer(_treasury, securities);
        require(transferred, "Bond::close: security transfer failed");
    }

    /**
     * @dev Permits the owner to update the treasury address, recipient of any slashed funds.
     */
    function setTreasury(address treasury_) external whenNotPaused onlyOwner {
        _treasury = treasury_;
    }

    /**
     * @dev Securities are deposited at a 1 to 1 ratio, however slashing can change that.
     */
    function _redemptionAmount(uint256 amount, uint256 totalSupply)
        internal
        view
        returns (uint256)
    {
        uint256 securities = _securityToken.balanceOf(address(this));

        if (securities == totalSupply) {
            return amount;
        } else {
            uint256 redemptionRatio = (DECIMAL_OFFSET * securities) /
                totalSupply;
            return (redemptionRatio * amount) / DECIMAL_OFFSET;
        }
    }
}
