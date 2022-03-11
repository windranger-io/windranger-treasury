// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./Bond.sol";
import "./RoleAccessControl.sol";
import "./BondCreator.sol";
import "./BondCurator.sol";
import "../Roles.sol";
import "../Version.sol";

/**
 * @title Entry point for the Bond family of contract.
 *
 * @dev Orchestrates the various Bond contracts to provide a single function to aggregate the various calls.
 */
interface BondPortal {
    event CreateDao(uint256 id, address treasury);

    /**
     * @notice Initialises a new DAO with essential configuration.
     *
     * @param erc20CapableTreasury Treasury that receives forfeited collateral. Must not be address zero.
     * @return ID for the created DAO.
     */
    function createDao(address erc20CapableTreasury) external returns (uint256);

    /**
     * @notice Creates a new Bond, registering with the Bond Management contract.
     *
     * @dev Creates a new Bond with the BondCreator and registers it with the BondCurator.
     */
    function createManagedBond(
        uint256 daoId,
        Bond.MetaData memory metadata,
        Bond.Settings memory configuration
    ) external returns (address);
}
