// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./SingleCollateralMultiRewardBond.sol";
import "./RoleAccessControl.sol";
import "./BondCreator.sol";
<<<<<<< HEAD
=======
import "../Roles.sol";
>>>>>>> 2272a43 (building)
import "../Version.sol";

/**
 * @title Creates Bond contracts.
 *
 * @dev An upgradable contract that encapsulates the Bond implementation and associated deployment cost.
 */
contract BondFactory is
    RoleAccessControl,
    BondCreator,
    PausableUpgradeable,
    UUPSUpgradeable,
    Version
{
    event CreateBond(
        address indexed creator,
        address indexed bond,
        Bond.MetaData metadata,
        Bond.Settings configuration,
        Bond.TimeLockRewardPool[] rewards,
        address indexed treasury
    );

    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     */
    function initialize() external virtual initializer {
        __RoleAccessControl_init();
        __UUPSUpgradeable_init();
    }

    function createBond(
        Bond.MetaData calldata metadata,
        Bond.Settings calldata configuration,
        Bond.TimeLockRewardPool[] calldata rewards,
        address treasury
    ) external override whenNotPaused returns (address) {
        SingleCollateralMultiRewardBond bond = new SingleCollateralMultiRewardBond();

        emit CreateBond(
            _msgSender(),
            address(bond),
            metadata,
            configuration,
            rewards,
            treasury
        );

        bond.initialize(metadata, configuration, rewards, treasury);
        bond.transferOwnership(_msgSender());

        return address(bond);
    }

    /**
     * @notice Pauses most side affecting functions.
     */
    function pause() external whenNotPaused atLeastSysAdminRole {
        _pause();
    }

    /**
     * @notice Resumes all paused side affecting functions.
     */
    function unpause() external whenPaused atLeastSysAdminRole {
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
        atLeastSysAdminRole
    {}
}
