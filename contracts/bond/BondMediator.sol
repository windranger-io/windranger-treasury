// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./BondAccessControl.sol";
import "./BondCreator.sol";
import "./BondCurator.sol";
import "./CollateralWhitelist.sol";
import "./Roles.sol";
import "../Version.sol";

/**
 * @title Mediates between a Bond creator and Bond curator.
 *
 * @dev Orchestrates a BondCreator and BondCurator to provide a single function to aggregate the various calls
 *      providing a single function to create and setup a bond for management with the curator.
 */
contract BondMediator is
    BondAccessControl,
    CollateralWhitelist,
    PausableUpgradeable,
    UUPSUpgradeable,
    Version
{
    BondCreator private _creator;
    BondCurator private _curator;

    address private _treasury;

    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     *
     * @param factory A deployed BondCreator contract to use when creating bonds.
     * @param manager A deployed BondCurator contract to register created bonds with,
     * @param erc20CapableTreasury Treasury that receives forfeited collateral. Must not be address zero.
     * @param erc20CollateralTokens Collateral token contract. Must not be address zero.
     */
    function initialize(
        address factory,
        address manager,
        address erc20CapableTreasury,
        address erc20CollateralTokens
    ) external virtual initializer {
        require(
            AddressUpgradeable.isContract(factory),
            "BM: creator not a contract"
        );
        require(
            AddressUpgradeable.isContract(manager),
            "BM: curator not a contract"
        );
        require(
            erc20CapableTreasury != address(0),
            "BM: treasury address is zero"
        );

        __BondAccessControl_init();
        __CollateralWhitelist_init();
        __UUPSUpgradeable_init();

        _treasury = erc20CapableTreasury;
        _creator = BondCreator(factory);
        _curator = BondCurator(manager);
        _whitelistCollateral(erc20CollateralTokens);
    }

    /**
     * @notice Creates a new Bond, registering with the Bond Management contract.
     *
     * @dev Creates a new Bond with the BondCreator and registers it with the BondCurator.
     */
    function createManagedBond(
        string calldata name,
        string calldata symbol,
        uint256 debtTokens,
        address collateralTokens,
        uint256 expiryTimestamp,
        uint256 minimumDeposit,
        string calldata data
    ) external whenNotPaused onlyRole(Roles.BOND_ADMIN) returns (address) {
        require(
            isCollateralWhitelisted(collateralTokens),
            "BM: collateral not whitelisted"
        );
        BondCreator.BondIdentity memory id = BondCreator.BondIdentity({
            name: name,
            symbol: symbol
        });
        address bond = _creator.createBond(
            id,
            BondCreator.BondSettings({
                debtTokenAmount: debtTokens,
                collateralTokens: collateralTokens,
                treasury: _treasury,
                expiryTimestamp: expiryTimestamp,
                minimumDeposit: minimumDeposit,
                data: data
            })
        );

        OwnableUpgradeable(bond).transferOwnership(address(_curator));

        _curator.addBond(bond);

        return bond;
    }

    /**
     * @notice Pauses most side affecting functions.
     */
    function pause() external whenNotPaused onlyRole(Roles.BOND_ADMIN) {
        _pause();
    }

    /**
     * @notice Permits the owner to update the treasury address.
     *
     * @dev Only applies for bonds created after the update, previously created bond treasury addresses remain unchanged.
     */
    function setTreasury(address replacement)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        require(replacement != address(0), "BM: treasury address is zero");
        require(_treasury != replacement, "BM: identical treasury address");
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
     * @param erc20CollateralTokens token to remove from whitelist
     */
    function removeWhitelistedCollateral(address erc20CollateralTokens)
        external
        whenNotPaused
        onlyRole(Roles.BOND_ADMIN)
    {
        _removeWhitelistedCollateral(erc20CollateralTokens);
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
     * @notice Resumes all paused side affecting functions.
     */
    function unpause() external whenPaused onlyRole(Roles.BOND_ADMIN) {
        _unpause();
    }

    function bondCreator() external view returns (address) {
        return address(_creator);
    }

    function bondCurator() external view returns (address) {
        return address(_curator);
    }

    function treasury() external view returns (address) {
        return _treasury;
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
}
