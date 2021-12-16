// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./BondCreator.sol";
import "./BondCurator.sol";

/**
 * @title Manages bond contracts.
 *
 * @dev Store for common configuration and managing Bond contracts.
 */
contract AtomicBondManager {
    //TODO control - only owner
    //TODO upgradable

    //TODO init with these values non-zero & contracts
    BondCreator private _creator;
    BondCurator private _curator;

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
}
