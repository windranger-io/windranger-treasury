// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./ExpiryTimestamp.sol";
import "./Redeemable.sol";

/**
 * @title Bond contract that issues debt tokens in exchange for a collateral deposited.
 *
 * @dev A single token type is held by the contract as collateral, with the Bond ERC20 token being the debt.
 */
contract Bond is
    ERC20Upgradeable,
    ExpiryTimestamp,
    OwnableUpgradeable,
    PausableUpgradeable,
    Redeemable
{
    /// Multiplier / divider for four decimal places, used in redemption ratio calculation.
    uint256 private constant _REDEMPTION_RATIO_ACCURACY = 10000;

    /// Only used in conjunction with slashing. Accuracy defined by REDEMPTION_RATIO_ACCURACY
    uint256 private _redemptionRatio;

    /*
     * Collateral that is held by the bond, owed to the Guarantors (unless slashed).
     * Kept to guard against the edge case of collateral tokens being directly transferred
     * (i.e. transfer in the collateral contract, not via deposit) to the contract address inflating redemption amounts.
     */
    uint256 private _guarantorCollateral;

    /// Balance of debts tokens held by guarantors, double accounting avoids potential affects of any minting/burning
    uint256 private _debtTokensOutstanding;

    /// Balance of debt tokens held by the Bond when redemptions were allowed.
    uint256 private _excessDebtTokens;

    IERC20MetadataUpgradeable private _collateralTokens;
    string private _data;
    uint256 private _initialDebtTokens;
    uint256 private _collateralSlashed;
    address private _treasury;

    event AllowRedemption(address authorizer);
    event DebtIssue(address receiver, string debSymbol, uint256 debtAmount);
    event Deposit(
        address depositor,
        string collateralSymbol,
        uint256 collateralAmount
    );
    event Expire(
        address sender,
        address treasury,
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
    event WithdrawCollateral(
        address treasury,
        string collateralSymbol,
        uint256 collateralAmount
    );

    /**
     * @param erc20CollateralTokens_ to avoid being able to break the Bond behaviours the reference to the collateral
     *              tokens cannot be be changed after init,
     *              To update the tokens address, either follow the proxy convention for tokens, or crete a new bond.
     */
    function initialize(
        string calldata name_,
        string calldata symbol_,
        uint256 debtTokens_,
        address erc20CollateralTokens_,
        address erc20CapableTreasury_,
        uint256 expiryTimestamp_,
        string calldata data_
    ) external initializer {
        __ERC20_init(name_, symbol_);
        __Ownable_init();
        __Pausable_init();
        __ExpiryTimestamp_init(expiryTimestamp_);
        __Redeemable_init();

        require(
            erc20CapableTreasury_ != address(0),
            "Bond: treasury is zero address"
        );
        require(
            erc20CollateralTokens_ != address(0),
            "Bond: collateral is zero address"
        );

        _collateralTokens = IERC20MetadataUpgradeable(erc20CollateralTokens_);
        _data = data_;
        _initialDebtTokens = debtTokens_;
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
        _allowRedemption();
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
     * @dev Before the deposit can be made, this contract must have been approved to transfer the given amount
     * from the ERC20 token being used as collateral.
     */
    function deposit(uint256 amount) external whenNotPaused whenNotRedeemable {
        require(amount > 0, "Bond: too small");
        require(amount <= _debtTokensRemaining(), "Bond: too large");

        _guarantorCollateral += amount;
        _debtTokensOutstanding += amount;

        emit Deposit(_msgSender(), _collateralTokens.symbol(), amount);

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _collateralTokens.transferFrom(
            _msgSender(),
            address(this),
            amount
        );
        require(transferred, "Bond: collateral transfer failed");

        emit DebtIssue(_msgSender(), symbol(), amount);

        _transfer(address(this), _msgSender(), amount);

        if (hasFullCollateral()) {
            emit FullCollateral(
                _collateralTokens.symbol(),
                _collateralTokens.balanceOf(address(this))
            );
        }
    }

    /**
     *  @notice Moves any remaining collateral to the Treasury and pauses the bond.
     *  @dev A fail safe, callable by anyone after the Bond has expired.
     *       If Ownership is lost, this can be used to move all remaining collateral to the Treasury,
     *       after which petitions for redemption can be made.
     *  @dev Expiry operates separately to pause, so a paused contract can be expired (fail safe for loss of
     *       Ownership).
     */
    function expire() external whenBeyondExpiry {
        uint256 collateralBalance = _collateralTokens.balanceOf(address(this));
        require(collateralBalance > 0, "Bond: no collateral remains");

        emit Expire(
            _msgSender(),
            _treasury,
            _collateralTokens.symbol(),
            collateralBalance
        );

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _collateralTokens.transfer(
            _treasury,
            collateralBalance
        );
        require(transferred, "Bond: collateral transfer failed");

        _pauseSafely();
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
        require(amount > 0, "Bond: too small");
        require(balanceOf(_msgSender()) >= amount, "Bond: too few debt tokens");

        uint256 totalSupply = totalSupply() - _excessDebtTokens;
        uint256 redemptionAmount = _redemptionAmount(amount, totalSupply);
        _guarantorCollateral -= redemptionAmount;
        _debtTokensOutstanding -= redemptionAmount;

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
        require(transferred, "Bond: collateral transfer failed");
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
        require(amount > 0, "Bond: too small");
        require(amount <= _guarantorCollateral, "Bond: too large");

        _guarantorCollateral -= amount;
        _collateralSlashed += amount;

        emit Slash(_collateralTokens.symbol(), amount);

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _collateralTokens.transfer(_treasury, amount);
        require(transferred, "Bond: collateral transfer failed");
    }

    /**
     * @dev Permits the owner to update the treasury address, recipient of any slashed funds.
     */
    function setTreasury(address treasury_) external whenNotPaused onlyOwner {
        require(treasury_ != address(0), "Bond: treasury is zero address");
        _treasury = treasury_;
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
        uint256 collateralBalance = _collateralTokens.balanceOf(address(this));
        require(collateralBalance > 0, "Bond: no collateral remains");

        emit WithdrawCollateral(
            _treasury,
            _collateralTokens.symbol(),
            collateralBalance
        );

        // Unknown ERC20 token behaviour, cater for bool usage
        bool transferred = _collateralTokens.transfer(
            _treasury,
            collateralBalance
        );
        require(transferred, "Bond: collateral transfer failed");
    }

    /**
     *  @dev Balance of collateral owned to Guarantors currently held by the Bond.
     *       As collateral has come from guarantors, the balance changes on deposit, redeems, slashing and flushing.
     *      This may be different to the balanceOf(this), if collateral tokens have been directly transferred
     *      i.e. direct transfer interaction with the token contract, rather then using the Bond operations.
     */
    function collateral() external view returns (uint256) {
        return _guarantorCollateral;
    }

    /**
     * @dev Sum of the collateral that has been slashed from the Bond, to date.
     */
    function collateralSlashed() external view returns (uint256) {
        return _collateralSlashed;
    }

    /**
     * @dev The generic storage box for Bond related information not managed by the Bond (performance factor, assessment date, rewards pool).
     */
    function data() external view returns (string memory) {
        return _data;
    }

    /**
     *  @dev Balance of debt tokens held by the bond.
     */
    function debtTokens() external view returns (uint256) {
        return _debtTokensRemaining();
    }

    /**
     * @dev Sum of debt tokens currently held by Guarantors.
     *      Unaffected by minting or burning of the Bond's held debt tokens.
     */
    function debtTokensOutstanding() external view returns (uint256) {
        return _debtTokensOutstanding;
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
     * @dev Retrieves the address that receives any slashed funds.
     */
    function treasury() external view returns (address) {
        return _treasury;
    }

    /**
     * @dev Whether or not the Bond contract has achieved full collateral target.
     */
    function hasFullCollateral() public view returns (bool) {
        return _debtTokensRemaining() == 0;
    }

    /**
     * @dev Creates additional debt tokens, inflating the supply, which without additional deposits affects the redemption ratio.
     */
    function _mint(uint256 amount) private whenNotPaused whenNotRedeemable {
        require(amount > 0, "Bond::mint: too small");
        _mint(address(this), amount);
    }

    /**
     *  @notice Ensure the Bond is paused.
     *  @dev Pauses the Bond if not already paused. If already paused, does nothing (not revert).
     */
    function _pauseSafely() private {
        if (!paused()) {
            _pause();
        }
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
        return (_redemptionRatio * amount) / _REDEMPTION_RATIO_ACCURACY;
    }

    /**
     * @dev Determines the current redemption ratio for any redemption that would occur based on the current
     * guarantor collateral and total supply.
     */
    function _calculateRedemptionRation() private view returns (uint256) {
        return
            (_REDEMPTION_RATIO_ACCURACY * _guarantorCollateral) /
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
     * @dev Whether or not the Bond contract has debt tokens remaining. Has not reached the collateral target.
     */
    function _hasDebtTokensRemaining() private view returns (bool) {
        return _debtTokensRemaining() > 0;
    }
}
