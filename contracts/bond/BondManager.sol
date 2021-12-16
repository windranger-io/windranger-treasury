// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./CollateralWhitelist.sol";
import "./BondCurator.sol";

//TODO owns bonds, single point of permission management for all bonds
/**
 * @title Manages bond contracts.
 *
 * @dev Store for common configuration and managing Bond contracts.
 */
contract BondManager is
    BondCurator,
    CollateralWhitelist,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    EnumerableSetUpgradeable.AddressSet private _bonds;
    address private _treasury;

    //TODO doco required init bond, with BM as the owner
    function addBond(address bond) external override {
        //TODO event

        bool added = _bonds.add(bond);
        require(added, "BondManager: already present");

        require(
            OwnableUpgradeable(bond).owner() == address(this),
            "BondManager: not bond owner"
        );
    }

    //TODO update messagegs

    /**
     * @notice Initialises with the given collateral tokens automatically being whitelisted.
     *
     * @param erc20CollateralTokens Collateral token contract. Must not be address zero.
     * @param erc20CapableTreasury Treasury that receives forfeited collateral. Must not be address zero.
     */
    function initialize(
        address erc20CollateralTokens,
        address erc20CapableTreasury
    ) external virtual initializer {
        __BondManager_init(erc20CollateralTokens, erc20CapableTreasury);
    }

    /**
     * @notice Permits the owner to update the treasury address.
     *
     * @dev Only applies for bonds created after the update, previously created bond treasury addresses remain unchanged.
     */
    function setTreasury(address replacement) external onlyOwner {
        require(replacement != address(0), "BF: treasury is zero address");
        require(_treasury != replacement, "BF: treasury address identical");
        _treasury = replacement;
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
        onlyOwner
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
        onlyOwner
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
        onlyOwner
    {
        _whitelistCollateral(erc20CollateralTokens);
    }

    function bondAt(uint256 index) external view returns (address) {
        require(
            EnumerableSetUpgradeable.length(_bonds) > index,
            "BondManager: too large"
        );

        return EnumerableSetUpgradeable.at(_bonds, index);
    }

    function bondCount() external view returns (uint256) {
        return EnumerableSetUpgradeable.length(_bonds);
    }

    function treasury() external view returns (address) {
        return _treasury;
    }

    function __BondManager_init(
        address erc20CollateralTokens,
        address erc20CapableTreasury
    ) internal onlyInitializing {
        __Ownable_init();
        __CollateralWhitelist_init();

        require(
            erc20CapableTreasury != address(0),
            "BF: treasury is zero address"
        );

        _treasury = erc20CapableTreasury;

        _whitelistCollateral(erc20CollateralTokens);
    }

    /**
     * @notice Permits only the owner to perform proxy upgrades.
     *
     * @dev Only applicable when deployed as implementation to a UUPS proxy.
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
