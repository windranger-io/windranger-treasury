// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./ExpiryTimestamp.sol";
import "./SingleCollateralBond.sol";
import "./MetaDataStore.sol";
import "./Redeemable.sol";

/**
 * @title A Bond is an issuance of debt tokens, which are exchange for deposit of collateral.
 *
 * @notice A single type of ERC20 token is accepted as collateral.
 *
 * The Bond uses a single redemption model. Before redemption, receiving and slashing collateral is permitted,
 * while after redemption, redeem (by guarantors) or complete withdrawal (by owner) is allowed.
 *
 * @dev A single token type is held by the contract as collateral, with the Bond ERC20 token being the debt.
 */
contract ERC20SingleCollateralBond is
    ERC20Upgradeable,
    ExpiryTimestamp,
    SingleCollateralBond,
    MetaDataStore,
    OwnableUpgradeable,
    PausableUpgradeable,
    Redeemable
{
    // Multiplier / divider for four decimal places, used in redemption ratio calculation.
    uint256 private constant _REDEMPTION_RATIO_ACCURACY = 1e4;

    /*
     * Collateral that is held by the bond, owed to the Guarantors (unless slashed).
     *
     * Kept to guard against the edge case of collateral tokens being directly transferred
     * (i.e. transfer in the collateral contract, not via deposit) to the contract address inflating redemption amounts.
     */
    uint256 private _collateral;

    uint256 private _collateralSlashed;

    IERC20MetadataUpgradeable private _collateralTokens;

    uint256 private _debtTokensInitialSupply;

    // Balance of debts tokens held by guarantors, double accounting avoids potential affects of any minting/burning
    uint256 private _debtTokensOutstanding;

    // Balance of debt tokens held by the Bond when redemptions were allowed.
    uint256 private _debtTokensRedemptionExcess;

    // Minimum debt holding allowed in the pre-redemption state.
    uint256 private _minimumDeposit;

    /*
     * Ratio value between one (100% bond redeem) and zero (0% redeem), accuracy defined by _REDEMPTION_RATIO_ACCURACY.
     *
     * Calculated only once, when the redemption is allowed. Ratio will be one, unless slashing has occurred.
     */
    uint256 private _redemptionRatio;

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
     * @param erc20CollateralTokens To avoid being able to break the Bond behaviour, the reference to the collateral
     *              tokens cannot be be changed after init.
     *              To update the tokens address, either follow the proxy convention for the collateral,
     *              or migrate to a new bond.
     * @param data Metadata not required for the operation of the Bond, but needed by external actors.
     * @param minimumDepositHolding Minimum debt holding allowed in the deposit phase. Once the minimum is met,
     *              any sized deposit from that account is allowed, as the minimum has already been met.
     */
    function initialize(
        string calldata name,
        string calldata symbol,
        uint256 debtAmount,
        address erc20CollateralTokens,
        address erc20CapableTreasury,
        uint256 expiryTimestamp,
        uint256 minimumDepositHolding,
        string calldata data
    ) external initializer {
        __ERC20_init(name, symbol);
        __Ownable_init();
        __Pausable_init();
        __ExpiryTimestamp_init(expiryTimestamp);
        __MetaDataStore_init(data);
        __Redeemable_init();

        require(
            erc20CapableTreasury != address(0),
            "Bond: treasury is zero address"
        );
        require(
            erc20CollateralTokens != address(0),
            "Bond: collateral is zero address"
        );

        _collateralTokens = IERC20MetadataUpgradeable(erc20CollateralTokens);
        _debtTokensInitialSupply = debtAmount;
        _minimumDeposit = minimumDepositHolding;
        _treasury = erc20CapableTreasury;

        _mint(debtAmount);
    }

    function allowRedemption()
        external
        override
        whenNotPaused
        whenNotRedeemable
        onlyOwner
    {
        _allowRedemption();
        emit AllowRedemption(_msgSender());

        if (_hasDebtTokensRemaining()) {
            _debtTokensRedemptionExcess = _debtTokensRemaining();

            emit PartialCollateral(
                _collateralTokens.symbol(),
                _collateralTokens.balanceOf(address(this)),
                symbol(),
                _debtTokensRemaining()
            );
        }

        if (_hasBeenSlashed()) {
            _redemptionRatio = _calculateRedemptionRatio();
        }
    }

    function deposit(uint256 amount)
        external
        override
        whenNotPaused
        whenNotRedeemable
    {
        require(amount > 0, "Bond: too small");
        require(amount <= _debtTokensRemaining(), "Bond: too large");
        require(
            balanceOf(_msgSender()) + amount >= _minimumDeposit,
            "Bond: below minimum"
        );

        _collateral += amount;
        _debtTokensOutstanding += amount;

        emit Deposit(_msgSender(), _collateralTokens.symbol(), amount);

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
     *  @notice Moves all remaining collateral to the Treasury and pauses the bond.
     *
     *  @dev A fail safe, callable by anyone after the Bond has expired.
     *       If control is lost, this can be used to move all remaining collateral to the Treasury,
     *       after which petitions for redemption can be made.
     *
     *  Expiry operates separately to pause, so a paused contract can be expired (fail safe for loss of control).
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

        bool transferred = _collateralTokens.transfer(
            _treasury,
            collateralBalance
        );
        require(transferred, "Bond: collateral transfer failed");

        _pauseSafely();
    }

    function pause() external override whenNotPaused onlyOwner {
        _pause();
    }

    function redeem(uint256 amount)
        external
        override
        whenNotPaused
        whenRedeemable
    {
        require(amount > 0, "Bond: too small");
        require(balanceOf(_msgSender()) >= amount, "Bond: too few debt tokens");

        uint256 totalSupply = totalSupply() - _debtTokensRedemptionExcess;
        uint256 redemptionAmount = _redemptionAmount(amount, totalSupply);
        _collateral -= redemptionAmount;
        _debtTokensOutstanding -= redemptionAmount;

        emit Redemption(
            _msgSender(),
            symbol(),
            amount,
            _collateralTokens.symbol(),
            redemptionAmount
        );

        _burn(_msgSender(), amount);

        // Slashing can reduce redemption amount to zero
        if (redemptionAmount > 0) {
            bool transferred = _collateralTokens.transfer(
                _msgSender(),
                redemptionAmount
            );
            require(transferred, "Bond: collateral transfer failed");
        }
    }

    function unpause() external override whenPaused onlyOwner {
        _unpause();
    }

    function slash(uint256 amount)
        external
        override
        whenNotPaused
        whenNotRedeemable
        onlyOwner
    {
        require(amount > 0, "Bond: too small");
        require(amount <= _collateral, "Bond: too large");

        _collateral -= amount;
        _collateralSlashed += amount;

        emit Slash(_collateralTokens.symbol(), amount);

        bool transferred = _collateralTokens.transfer(_treasury, amount);
        require(transferred, "Bond: collateral transfer failed");
    }

    function setMetaData(string calldata data)
        external
        override
        whenNotPaused
        onlyOwner
    {
        return _setMetaData(data);
    }

    function setTreasury(address replacement)
        external
        override
        whenNotPaused
        onlyOwner
    {
        require(replacement != address(0), "Bond: treasury is zero address");
        _treasury = replacement;
    }

    function withdrawCollateral()
        external
        override
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

        bool transferred = _collateralTokens.transfer(
            _treasury,
            collateralBalance
        );
        require(transferred, "Bond: collateral transfer failed");
    }

    /**
     * @notice How much collateral held by the bond is owned to the Guarantors.
     *
     * @dev  Collateral has come from guarantors, with the balance changes on deposit, redeem, slashing and flushing.
     *      This value may differ to balanceOf(this), if collateral tokens have been directly transferred
     *      i.e. direct transfer interaction with the token contract, rather then using the Bond functions.
     */
    function collateral() external view returns (uint256) {
        return _collateral;
    }

    /**
     * @notice Sum of collateral moved from the Bond to the Treasury by slashing.
     *
     * @dev Other methods of performing moving of collateral outside of slashing, are not included.
     */
    function collateralSlashed() external view returns (uint256) {
        return _collateralSlashed;
    }

    /**
     * @notice Balance of debt tokens held by the bond.
     *
     * @dev Number of debt tokens that can still be swapped for collateral token (if before redemption state),
     *          or the amount of under-collateralization (if during redemption state).
     *
     */
    function debtTokens() external view returns (uint256) {
        return _debtTokensRemaining();
    }

    /**
     * @notice Balance of debt tokens held by the guarantors.
     *
     * @dev Number of debt tokens still held by Guarantors. The number only reduces when guarantors redeem
     *          (swap their debt tokens for collateral).
     */
    function debtTokensOutstanding() external view returns (uint256) {
        return _debtTokensOutstanding;
    }

    /**
     * @notice Balance of debt tokes outstanding when the redemption state was entered.
     *
     * @dev As the collateral deposited is a 1:1, this is amount of collateral that was not received.
     *
     * @return zero if redemption is not yet allowed or full collateral was met, otherwise the number of debt tokens
     *          remaining without matched deposit when redemption was allowed,
     */
    function excessDebtTokens() external view returns (uint256) {
        return _debtTokensRedemptionExcess;
    }

    /**
     * @notice Debt tokens created on Bond initialization.
     *
     * @dev Number of debt tokens minted on init. The total supply of debt tokens will decrease, as redeem burns them.
     */
    function initialDebtTokens() external view returns (uint256) {
        return _debtTokensInitialSupply;
    }

    /**
     * @notice Minimum amount of debt allowed for the created Bonds.
     *
     * @dev Avoids micro holdings, as some operations cost scale linear to debt holders.
     *      Once an account holds the minimum, any deposit from is acceptable as their holding is above the minimum.
     */
    function minimumDeposit() external view returns (uint256) {
        return _minimumDeposit;
    }

    function treasury() external view returns (address) {
        return _treasury;
    }

    function hasFullCollateral() public view returns (bool) {
        return _debtTokensRemaining() == 0;
    }

    /**
     * @dev Mints additional debt tokens, inflating the supply. Without additional deposits the redemption ratio is affected.
     */
    function _mint(uint256 amount) private whenNotPaused whenNotRedeemable {
        require(amount > 0, "Bond::mint: too small");
        _mint(address(this), amount);
    }

    /**
     *  @dev Pauses the Bond if not already paused. If already paused, does nothing (no revert).
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
        if (_collateral == totalSupply) {
            return amount;
        } else {
            return _applyRedemptionRation(amount);
        }
    }

    function _applyRedemptionRation(uint256 amount)
        private
        view
        returns (uint256)
    {
        return (_redemptionRatio * amount) / _REDEMPTION_RATIO_ACCURACY;
    }

    /**
     * @return Redemption ration float value as an integer.
     *           The float has been multiplied by _REDEMPTION_RATIO_ACCURACY, with any excess accuracy floored (lost).
     */
    function _calculateRedemptionRatio() private view returns (uint256) {
        return
            (_REDEMPTION_RATIO_ACCURACY * _collateral) /
            (totalSupply() - _debtTokensRedemptionExcess);
    }

    /**
     * @dev The balance of debt token held; amount of debt token that are awaiting collateral swap.
     */
    function _debtTokensRemaining() private view returns (uint256) {
        return balanceOf(address(this));
    }

    /**
     * @dev Whether the Bond has been slashed. Assumes a 1:1 deposit ratio (collateral to debt).
     */
    function _hasBeenSlashed() private view returns (bool) {
        return _collateral != (totalSupply() - _debtTokensRedemptionExcess);
    }

    /**
     * @dev Whether the Bond has held debt tokens.
     */
    function _hasDebtTokensRemaining() private view returns (bool) {
        return _debtTokensRemaining() > 0;
    }
}
