// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./CollateralWhitelist.sol";
import "./Bond.sol";

/**
 * @title Creates configured bond contracts.
 *
 * @dev Applies common configuration to bond contracts created.
 */
contract BondFactory is
    CollateralWhitelist,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    address private _treasury;

    event CreateBond(
        address bond,
        string name,
        string debtSymbol,
        uint256 debtAmount,
        address owner,
        address treasury,
        uint256 expiryTimestamp,
        string data
    );

    /**
     * @dev Initialises the factory with the given collateral tokens automatically being whitelisted.
     */
    function initialize(
        address erc20CollateralTokens_,
        address erc20CapableTreasury_
    ) external virtual initializer {
        __BondFactory_init(erc20CollateralTokens_, erc20CapableTreasury_);
    }

    function createBond(
        string calldata name_,
        string calldata symbol_,
        uint256 debtTokens_,
        string calldata collateralTokenSymbol_,
        uint256 expiryTimestamp_,
        string calldata data_
    ) external returns (address) {
        require(
            isCollateralWhitelisted(collateralTokenSymbol_),
            "BF: collateral not whitelisted"
        );

        Bond bond = new Bond();

        emit CreateBond(
            address(bond),
            name_,
            symbol_,
            debtTokens_,
            owner(),
            _treasury,
            expiryTimestamp_,
            data_
        );

        bond.initialize(
            name_,
            symbol_,
            debtTokens_,
            whitelistedCollateralAddress(collateralTokenSymbol_),
            _treasury,
            expiryTimestamp_,
            data_
        );
        bond.transferOwnership(owner());

        return address(bond);
    }

    /**
     * @dev Permits the owner to update the treasury address.
     * Only applies for bonds created after the update, previously created bonds remain unchanged.
     */
    function setTreasury(address treasury_) external onlyOwner {
        require(treasury_ != address(0), "BF: treasury is zero address");
        require(_treasury != treasury_, "BF: treasury address identical");
        _treasury = treasury_;
    }

    /**
     * @dev Permits the owner to update the collateral token address of an already whitelisted token.
     * Only applies for bonds created after the update, previously created bonds remain unchanged.
     */
    function updateWhitelistedCollateral(address erc20CollateralTokens_)
        external
        onlyOwner
    {
        _updateWhitelistedCollateral(erc20CollateralTokens_);
    }

    /**
     * @notice Permits the owner to remove a collateral token from being accepted in future bonds.
     * Only applies for bonds created after the removal, previously created bonds remain unchanged.
     */
    function removeWhitelistedCollateral(string calldata symbol)
        external
        onlyOwner
    {
        _removeWhitelistedCollateral(symbol);
    }

    /**
     * @notice When a bond is created, the tokens used as collateral must have been whitelisted.
     *
     * @dev Whitelists the erc20 symbol as a Bond collateral token from now onwards.
     *      On bond creation the tokens address used is retrieved by symbol from the whitelist.
     */
    function whitelistCollateral(address erc20CollateralTokens_)
        external
        onlyOwner
    {
        _whitelistCollateral(erc20CollateralTokens_);
    }

    /**
     * @dev Retrieves the address that receives any slashed or remaining funds.
     */
    function treasury() external view returns (address) {
        return _treasury;
    }

    function __BondFactory_init(
        address erc20CollateralTokens_,
        address erc20CapableTreasury_
    ) internal initializer {
        __Ownable_init();
        __CollateralWhitelist_init();

        require(
            erc20CapableTreasury_ != address(0),
            "BF: treasury is zero address"
        );

        _treasury = erc20CapableTreasury_;

        _whitelistCollateral(erc20CollateralTokens_);
    }

    /**
     * Permits only the owner to perform upgrades.
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
