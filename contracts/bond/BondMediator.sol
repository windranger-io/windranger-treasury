// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./BondAccessControl.sol";
import "./BondCreator.sol";
import "./BondCurator.sol";
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
     */
    function initialize(
        address factory,
        address manager,
        address erc20CapableTreasury
    ) external virtual initializer {
        require(
            AddressUpgradeable.isContract(factory),
            "Mediator: creator not a contract"
        );
        require(
            AddressUpgradeable.isContract(manager),
            "Mediator: curator not a contract"
        );
        require(
            erc20CapableTreasury != address(0),
            "Mediator: treasury address zero"
        );

        __BondAccessControl_init();
        __UUPSUpgradeable_init();

        _treasury = erc20CapableTreasury;
        _creator = BondCreator(factory);
        _curator = BondCurator(manager);
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
        string calldata collateralTokenSymbol,
        uint256 expiryTimestamp,
        uint256 minimumDeposit,
        string calldata data
    ) external whenNotPaused onlyRole(Roles.BOND_ADMIN) returns (address) {
        BondCreator.BondIdentity memory id = BondCreator.BondIdentity({
            name: name,
            symbol: symbol
        });
        address bond = _creator.createBond(
            id,
            BondCreator.BondSettings({
                debtTokens: debtTokens,
                collateralTokenSymbol: collateralTokenSymbol,
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
        require(replacement != address(0), "Mediator: treasury address zero");
        require(_treasury != replacement, "Mediator: same treasury address");
        _treasury = replacement;
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
