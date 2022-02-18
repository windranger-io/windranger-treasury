// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./CollateralWhitelist.sol";
import "./ERC20SingleCollateralBond.sol";
import "./BondAccessControl.sol";
import "./BondCreator.sol";
import "./BondIdentity.sol";
import "./BondSettings.sol";
import "./Roles.sol";
import "../Version.sol";

/**
 * @title Creates Bond contracts.
 *
 * @dev An upgradable contract that encapsulates the Bond implementation and associated deployment cost.
 */
contract BondFactory is
    BondAccessControl,
    BondCreator,
    CollateralWhitelist,
    PausableUpgradeable,
    UUPSUpgradeable,
    Version
{
    /**
     * @notice Initialises the factory with the given collateral tokens automatically being whitelisted.
     *
     * @param erc20CollateralTokens Collateral token contract. Must not be address zero.
     */
    function initialize(address erc20CollateralTokens)
        external
        virtual
        initializer
    {
        __BondFactory_init(erc20CollateralTokens);
    }

    function createBond(BondIdentity calldata id, BondSettings calldata config)
        external
        override
        whenNotPaused
        returns (address)
    {
        require(
            isCollateralWhitelisted(config.collateralTokenSymbol),
            "BF: collateral not whitelisted"
        );

        ERC20SingleCollateralBond bond = new ERC20SingleCollateralBond();

        emit CreateBond(
            address(bond),
            id.name,
            id.symbol,
            config.debtTokens,
            _msgSender(),
            config.treasury,
            config.expiryTimestamp,
            config.minimumDeposit,
            config.data
        );

        bond.initialize(
            id.name,
            id.symbol,
            config.debtTokens,
            whitelistedCollateralAddress(config.collateralTokenSymbol),
            config.treasury,
            config.expiryTimestamp,
            config.minimumDeposit,
            config.data
        );
        bond.transferOwnership(_msgSender());

        return address(bond);
    }

    /**
     * @notice Permits the owner to update the address of already whitelisted collateral token.
     *
     * @dev Only applies for bonds created after the update, previously created bonds remain unchanged.
     *
     * @param erc20CollateralTokens Must already be whitelisted and must not be address zero.
     */
    function updateWhitelistedCollateral(address erc20CollateralTokens)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _updateWhitelistedCollateral(erc20CollateralTokens);
    }

    /**
     * @notice Permits the owner to remove a collateral token from being accepted in future bonds.
     *
     * @dev Only applies for bonds created after the removal, previously created bonds remain unchanged.
     *
     * @param symbol Symbol must exist in the collateral whitelist.
     */
    function removeWhitelistedCollateral(string calldata symbol)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _removeWhitelistedCollateral(symbol);
    }

    /**
     * @notice Adds an ERC20 token to the collateral whitelist.
     *
     * @dev When a bond is created, the tokens used as collateral must have been whitelisted.
     *
     * @param erc20CollateralTokens Whitelists the token from now onwards.
     *      On bond creation the tokens address used is retrieved by symbol from the whitelist.
     */
    function whitelistCollateral(address erc20CollateralTokens)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _whitelistCollateral(erc20CollateralTokens);
    }

    /**
     * @notice Pauses most side affecting functions.
     */
    function pause() external whenNotPaused onlyRole(Roles.BOND_ADMIN) {
        _pause();
    }

    /**
     * @notice Resumes all paused side affecting functions.
     */
    function unpause() external whenPaused onlyRole(Roles.BOND_ADMIN) {
        _unpause();
    }

    /**
     * @notice Permits only the owner to perform proxy upgrades.
     *
     * @dev Only applicable when deployed as implementation to a UUPS proxy.
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(Roles.SYSTEM_ADMIN)
    {}

    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     */
    function __BondFactory_init(address erc20CollateralTokens)
        internal
        onlyInitializing
    {
        __BondAccessControl_init();
        __CollateralWhitelist_init();
        __UUPSUpgradeable_init();

        _whitelistCollateral(erc20CollateralTokens);
    }
}
