// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "./PerformanceBond.sol";
import "../RoleAccessControl.sol";
import "./PerformanceBondCreator.sol";
import "./PerformanceBondCurator.sol";
import "../Roles.sol";
import "../Version.sol";

/**
 * @title Entry point for the PerformanceBond family of contract.
 *
 * @dev Orchestrates the various PerformanceBond contracts to provide a single function to aggregate the various calls.
 */
interface PerformanceBondPortal {
    /**
     * @notice Initialises a new DAO with essential configuration.
     *
     * @param erc20CapableTreasury Treasury that receives forfeited collateral. Must not be address zero.
     * @return ID for the created DAO.
     */
    function createDao(address erc20CapableTreasury) external returns (uint256);

    /**
     * @notice Creates a new PerformanceBond, registering with the manager.
     *
     * @dev Creates a new PerformanceBond with the creator and registers it with the curator.
     */
    function createManagedPerformanceBond(
        uint256 daoId,
        PerformanceBond.MetaData calldata metadata,
        PerformanceBond.Settings calldata configuration,
        PerformanceBond.TimeLockRewardPool[] calldata rewards
    ) external returns (address);
}
