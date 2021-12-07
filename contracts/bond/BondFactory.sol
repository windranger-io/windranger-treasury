// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./CollateralWhitelist.sol";
import "./Bond.sol";

/**
 * @title Creates bond contracts.
 *
 * @dev Uses common configuration when creating bond contracts.
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
     * @notice Initialises the factory with the given collateral tokens automatically being whitelisted.
     *
     * @param erc20CollateralTokens_ Collateral token contract. Must not be address zero.
     * @param erc20CapableTreasury_ Treasury that receives forfeited collateral. Must not be address zero.
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
     * @notice Permits the owner to update the treasury address.
     *
     * @dev Only applies for bonds created after the update, previously created bond treasury addresses remain unchanged.
     */
    function setTreasury(address treasury_) external onlyOwner {
        require(treasury_ != address(0), "BF: treasury is zero address");
        require(_treasury != treasury_, "BF: treasury address identical");
        _treasury = treasury_;
    }

    /**
     * @notice Permits the owner to update the address of already whitelisted collateral token.
     *
     * @dev Only applies for bonds created after the update, previously created bonds remain unchanged.
     *
     * @param erc20CollateralTokens_ Must already be whitelisted and must not be address zero.
     */
    function updateWhitelistedCollateral(address erc20CollateralTokens_)
        external
        onlyOwner
    {
        _updateWhitelistedCollateral(erc20CollateralTokens_);
    }

    /**
     * @notice Permits the owner to remove a collateral token from being accepted in future bonds.
     *
     * @dev Only applies for bonds created after the removal, previously created bonds remain unchanged.
     *
     * @param symbol_ Symbol must exist in the collateral whitelist.
     */
    function removeWhitelistedCollateral(string calldata symbol_)
        external
        onlyOwner
    {
        _removeWhitelistedCollateral(symbol_);
    }

    /**
     * @notice Adds an ERC20 token to the collateral whitelist.
     *
     * @dev When a bond is created, the tokens used as collateral must have been whitelisted.
     *
     * @param erc20CollateralTokens_ Whitelists the token from now onwards.
     *      On bond creation the tokens address used is retrieved by symbol from the whitelist.
     */
    function whitelistCollateral(address erc20CollateralTokens_)
        external
        onlyOwner
    {
        _whitelistCollateral(erc20CollateralTokens_);
    }

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
     * @notice Permits only the owner to perform proxy upgrades.
     *
     * @dev Only applicable when deployed as implementation to a UUPS proxy.
     */
    function _authorizeUpgrade(address toImplementation_)
        internal
        override
        onlyOwner
    {}
}
