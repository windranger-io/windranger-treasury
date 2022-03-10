// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./ERC20SingleCollateralBond.sol";
import "./BondAccessControl.sol";
import "./BondCreator.sol";
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
    PausableUpgradeable,
    UUPSUpgradeable,
    Version
{
    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     */
    function initialize() external virtual initializer {
        __BondAccessControl_init();
        __UUPSUpgradeable_init();
    }

    function createBond(
        Bond.Metadata memory metadata,
        Bond.Settings memory configuration
    ) external override whenNotPaused returns (address) {
        ERC20SingleCollateralBond bond = new ERC20SingleCollateralBond();

        emit CreateBond(
            address(bond),
            metadata.name,
            metadata.symbol,
            configuration.debtTokenAmount,
            _msgSender(),
            configuration.treasury,
            configuration.expiryTimestamp,
            configuration.minimumDeposit,
            metadata.data
        );

        bond.initialize(
            metadata.name,
            metadata.symbol,
            configuration.debtTokenAmount,
            configuration.collateralTokens,
            configuration.treasury,
            configuration.expiryTimestamp,
            configuration.minimumDeposit,
            metadata.data
        );
        bond.transferOwnership(_msgSender());

        return address(bond);
    }

    /**
     * @notice Pauses most side affecting functions.
     */
    function pause() external whenNotPaused onlyGlobalRole(Roles.SYSTEM_ADMIN) {
        _pause();
    }

    /**
     * @notice Resumes all paused side affecting functions.
     */
    function unpause() external whenPaused onlyGlobalRole(Roles.SYSTEM_ADMIN) {
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
        onlyGlobalRole(Roles.SYSTEM_ADMIN)
    {}
}
