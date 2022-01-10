// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./BondCreator.sol";
import "./BondCurator.sol";
import "./Roles.sol";

interface OwnableUpgradeable {
    function transferOwnership(address newOwner) external;
}

/**
 * @title Mediates between a Bond creator and Bond curator.
 *
 * @dev Orchestrates a BondCreator and BondCurator to provide a single function to aggregate the various calls
 *      providing a single function to create and setup a bond for management with the curator.
 */
contract BondMediator is AccessControlUpgradeable, UUPSUpgradeable {
    BondCreator private _creator;
    BondCurator private _curator;

    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     *
     * @param factory A deployed BondCreator contract to use when creating bonds.
     * @param manager A deployed BondCurator contract to register created bonds with,
     */
    function initialize(address factory, address manager)
        external
        virtual
        initializer
    {
        require(
            AddressUpgradeable.isContract(factory),
            "Mediator: creator not a contract"
        );
        require(
            AddressUpgradeable.isContract(manager),
            "Mediator: curator not a contract"
        );

        __AccessControl_init();

        _creator = BondCreator(factory);
        _curator = BondCurator(manager);

        _setRoleAdmin(Roles.SYSTEM_ADMIN, Roles.DAO_ADMIN);
        _setupRole(Roles.DAO_ADMIN, _msgSender());
        _setupRole(Roles.SYSTEM_ADMIN, _msgSender());
        _setupRole(Roles.BOND_ADMIN, _msgSender());
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
    ) external onlyRole(Roles.BOND_ADMIN) returns (address) {
        address bond = _creator.createBond(
            name,
            symbol,
            debtTokens,
            collateralTokenSymbol,
            expiryTimestamp,
            minimumDeposit,
            data
        );

        OwnableUpgradeable(bond).transferOwnership(address(_curator));

        _curator.addBond(bond);

        return bond;
    }

    function bondCreator() external view returns (address) {
        return address(_creator);
    }

    function bondCurator() external view returns (address) {
        return address(_curator);
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
