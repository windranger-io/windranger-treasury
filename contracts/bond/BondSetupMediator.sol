// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./BondCreator.sol";
import "./BondCurator.sol";

/**
 * @title Manages bond contracts.
 *
 * @dev Store for common configuration and managing Bond contracts.
 */
contract BondSetupMediator is OwnableUpgradeable, UUPSUpgradeable {
    //TODO control - only owner

    //TODO init with these values non-zero & contracts
    BondCreator private _creator;
    BondCurator private _curator;

    function initialize(address factory, address manager)
        external
        virtual
        initializer
    {
        //TODO check contract addresses

        _creator = BondCreator(factory);
        _curator = BondCurator(manager);
    }

    function createManagedBond(
        string calldata name,
        string calldata symbol,
        uint256 debtTokens,
        string calldata collateralTokenSymbol,
        uint256 expiryTimestamp,
        uint256 minimumDeposit,
        string calldata data
    ) external returns (address) {
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
