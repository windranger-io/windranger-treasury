// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/**
 * @title Bond contract that issues debt tokens in exchange for a collateral deposited.
 *
 * @dev A single token type is held by the contract as collateral, with the Bond ERC20 token being the debt.
 */
contract Bond is ERC20Upgradeable, OwnableUpgradeable, PausableUpgradeable {
    event AllowRedemption(address authorizer);
    event DebtIssue(address receiver, string debSymbol, uint256 debtAmount);
    event Deposit(
        address depositor,
        string collateralSymbol,
        uint256 collateralAmount
    );
    event PartialCollateral(
        string collateralSymbol,
        uint256 collateralAmount,
        string debtSymbol,
        uint256 debtRemaining
    );
    event FullCollateral(string collateralSymbol, uint256 collateralAmount);
    event Redemption(
        address redeemer,
        string debtSymbol,
        uint256 debtAmount,
        string collateralSymbol,
        uint256 collateralAmount
    );
    event Slash(string collateralSymbol, uint256 collateralAmount);
    event WithdrawCollateral(address receiver, string symbol, uint256 amount);

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
    uint256 private constant REDEMPTION_RATIO_ACCURACY = 10000;

    /// Only used in conjunction with slashing. Accuracy defined by REDEMPTION_RATIO_ACCURACY
    uint256 private _redemptionRatio;

    /*
     * An isolated count for the collateral that currently owed to Guarantors.
     * Kept to guard against the edge case of collateral tokens being directly transferred
     * (i.e. transfer in the collateral contract, not via deposit) to the contract address inflating redemption amounts.
     */
    /// Collateral currently owed to guarantors.
    uint256 private _guarantorCollateral;

    /// The outstanding balance of debt tokens when redemptions were allowed, amount now expected after full redemptions.
    uint256 private _excessDebtTokens;

    uint256 private _initialDebtTokens;

    IERC20MetadataUpgradeable private _collateralTokens;
    address private _treasury;
    bool private _isRedemptionAllowed;

    /**
     * @param erc20CollateralTokens_ to avoid being able to break the Bond behaviours the reference to the collateral
     *              tokens cannot be be changed after init,
     *              To update the tokens address, either follow the proxy convention for tokens, or crete a new bond.
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 debtTokens_,
        address erc20CollateralTokens_,
        address erc20CapableTreasury_
    ) external initializer {
        __ERC20_init(name_, symbol_);
        __Ownable_init();
        __Pausable_init();

        require(
            erc20CapableTreasury_ != address(0),
            "Bond::init: treasury is zero address"
        );
        require(
            erc20CollateralTokens_ != address(0),
            "Bond::init: collateral tokens is zero address"
        );

        _collateralTokens = IERC20MetadataUpgradeable(erc20CollateralTokens_);
        _initialDebtTokens = debtTokens_;
        _isRedemptionAllowed = false;
        _treasury = erc20CapableTreasury_;

        _mint(debtTokens_);
    }

    /**
     * @dev Debt tokens are not allowed to be redeemed before the owner grants permission.
     */
    function allowRedemption()
        external
        whenNotPaused
        whenNotRedeemable
        onlyOwner
    {
        _isRedemptionAllowed = true;
        emit AllowRedemption(_msgSender());

        if (_hasDebtTokensRemaining()) {
            _excessDebtTokens = _debtTokensRemaining();

            emit PartialCollateral(
                _collateralTokens.symbol(),
                _collateralTokens.balanceOf(address(this)),
                symbol(),
                _debtTokensRemaining()
            );
        }

        if (_hasBeenSlashed()) {
            _redemptionRatio = _calculateRedemptionRation();
        }
    }

    /**
     * @dev whether the Bond is in the redemption state (allows redeem operation, but denies deposit, mint and slash).
     */
    function redeemable() external view returns (bool) {
        return _isRedemptionAllowed;
    }

    /**
     * @dev Before the deposit can be made, this contract must have been approved to transfer the given amount
     * from the ERC20 token being used as collateral.
     */
    function deposit(uint256 amount) external whenNotPaused whenNotRedeemable {
        require(amount > 0, "Bond::deposit: too small");
        require(amount <= _debtTokensRemaining(), "Bond::deposit: too large");

        _guarantorCollateral += amount;

        emit Deposit(_msgSender(), _collateralTokens.symbol(), amount);

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _collateralTokens.transferFrom(
            _msgSender(),
            address(this),
            amount
        );
        require(transferred, "Bond::deposit: collateral transfer failed");

        emit DebtIssue(_msgSender(), symbol(), amount);

        _transfer(address(this), _msgSender(), amount);

        if (_hasFullCollateral()) {
            emit FullCollateral(
                _collateralTokens.symbol(),
                _collateralTokens.balanceOf(address(this))
            );
        }
    }

    /**
     * @dev Balance outstanding when redemption was allowed. The amount of collateral not received (deposit 1:1 ratio).
     *
     * @return zero if redemption is not yet allowed or full collateral was met, otherwise the number of debt tokens
     *          remaining without matched deposit when redemption was allowed,
     */
    function excessDebtTokens() external view returns (uint256) {
        return _excessDebtTokens;
    }

    /**
     * @dev Number of debt tokens created on the Bond init. The total supply of debt tokens will decrease, as redeem burns them.
     */
    function initialDebtTokens() external view returns (uint256) {
        return _initialDebtTokens;
    }

    /**
     * @dev Creates additional debt tokens, inflating the supply, which without additional deposits affects the redemption ratio.
     */
    function _mint(uint256 amount) private whenNotPaused whenNotRedeemable {
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
     * @dev Converts the amount of debt tokens owned by the sender, at the exchange ratio determined by the remaining
     * amount of collateral against the remaining amount of debt.
     */
    function redeem(uint256 amount) external whenNotPaused whenRedeemable {
        require(amount > 0, "Bond::redeem: too small");
        require(
            balanceOf(_msgSender()) >= amount,
            "Bond:redeem: too few debt tokens"
        );

        uint256 totalSupply = totalSupply() - _excessDebtTokens;
        uint256 redemptionAmount = _redemptionAmount(amount, totalSupply);
        _guarantorCollateral -= redemptionAmount;

        emit Redemption(
            _msgSender(),
            symbol(),
            amount,
            _collateralTokens.symbol(),
            redemptionAmount
        );

        _burn(_msgSender(), amount);

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _collateralTokens.transfer(
            _msgSender(),
            redemptionAmount
        );
        require(transferred, "Bond::redeem: collateral transfer failed");
    }

    /**
     * @dev Resumes (unpauses) contract, allowing operation of all external functions.
     */
    function unpause() external whenPaused onlyOwner {
        _unpause();
    }

    /**
     * The amount of debt tokens remains the same. Slashing reduces the collateral tokens, so each debt token
     * is redeemable for less collateral.
     *
     * @dev Transfers the amount to the Treasury, reducing the amount available for later redemption (redemption ratio).
     */
    function slash(uint256 amount)
        external
        whenNotPaused
        whenNotRedeemable
        onlyOwner
    {
        require(amount > 0, "Bond::slash: too small");
        require(
            amount <= _guarantorCollateral,
            "Bond::slash: greater than available collateral"
        );

        _guarantorCollateral -= amount;

        emit Slash(_collateralTokens.symbol(), amount);

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _collateralTokens.transfer(_treasury, amount);
        require(transferred, "Bond::slash: collateral transfer failed");
    }

    /**
     * @dev Permits the owner to update the treasury address, recipient of any slashed funds.
     */
    function setTreasury(address treasury_) external whenNotPaused onlyOwner {
        require(
            treasury_ != address(0),
            "Bond::setTreasury: treasury cannot be zero address"
        );
        _treasury = treasury_;
    }

    /**
     * @dev Retrieves the address that receives any slashed funds.
     */
    function treasury() external view returns (address) {
        return _treasury;
    }

    /**
     * Allows the owner to move all the collateral held by the Bond into the Treasury.
     *
     * @dev Slashing can result in collateral remaining after full redemption due to flooring.
     *      Provides an emergency extracting moving of funds out of the Bond.
     */
    function withdrawCollateral()
        external
        whenNotPaused
        whenRedeemable
        onlyOwner
    {
        uint256 collateral = _collateralTokens.balanceOf(address(this));
        require(
            collateral > 0,
            "Bond::withdrawCollateral: no collateral remain"
        );

        emit WithdrawCollateral(
            _treasury,
            _collateralTokens.symbol(),
            collateral
        );

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _collateralTokens.transfer(_treasury, collateral);
        require(
            transferred,
            "Bond::withdrawCollateral: collateral transfer failed"
        );
    }

    /**
     * @dev Determines the current redemption ratio for any redemption that would occur based on the current
     * guarantor collateral and total supply.
     */
    function _calculateRedemptionRation() private view returns (uint256) {
        return
            (REDEMPTION_RATIO_ACCURACY * _guarantorCollateral) /
            (totalSupply() - _excessDebtTokens);
    }

    /**
     * @dev The balance of debt token held by the contract; amount of debt token that are awaiting swapping for collateral.
     */
    function _debtTokensRemaining() private view returns (uint256) {
        return balanceOf(address(this));
    }

    /**
     * @dev Whether the Bond has been slashed, assuming a 1:1 deposit ratio of collateral to debt.
     */
    function _hasBeenSlashed() private view returns (bool) {
        return _guarantorCollateral != (totalSupply() - _excessDebtTokens);
    }

    /**
     * @dev Whether or not the Bond contract has debt tokens remaining. Has not reached collateral the target.
     */
    function _hasDebtTokensRemaining() private view returns (bool) {
        return _debtTokensRemaining() > 0;
    }

    /**
     * @dev Whether or not the Bond contract has achieved full collateral target.
     */
    function _hasFullCollateral() private view returns (bool) {
        return _debtTokensRemaining() == 0;
    }

    /**
     * @dev Collateral is deposited at a 1 to 1 ratio, however slashing can change that lower.
     */
    function _redemptionAmount(uint256 amount, uint256 totalSupply)
        private
        view
        returns (uint256)
    {
        if (_guarantorCollateral == totalSupply) {
            return amount;
        } else {
            return _applyRedemptionRation(amount);
        }
    }

    /**
     * @dev Applies the redemption ratio calculation to the given amount.
     */
    function _applyRedemptionRation(uint256 amount)
        private
        view
        returns (uint256)
    {
        return (_redemptionRatio * amount) / REDEMPTION_RATIO_ACCURACY;
    }
}
