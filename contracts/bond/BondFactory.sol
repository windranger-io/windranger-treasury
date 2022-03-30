// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./SingleCollateralMultiRewardBond.sol";
import "./RoleAccessControl.sol";
import "./BondCreator.sol";
import "../Version.sol";
import "../sweep/SweepERC20.sol";

/**
 * @title Creates Bond contracts.
 *
 * @dev An upgradable contract that encapsulates the Bond implementation and associated deployment cost.
 */
contract BondFactory is
    RoleAccessControl,
    BondCreator,
    PausableUpgradeable,
    SweepERC20,
    UUPSUpgradeable,
    Version
{
    event CreateBond(
        address indexed bond,
        Bond.MetaData metadata,
        Bond.Settings configuration,
        Bond.TimeLockRewardPool[] rewards,
        address indexed treasury,
        address indexed instigator
    );

    /**
     * @param treasury Beneficiary of any token sweeping.
     */
    function initialize(address treasury) external virtual initializer {
        __RoleAccessControl_init();
        __UUPSUpgradeable_init();
        __TokenSweep_init(treasury);
    }

    function createBond(
        Bond.MetaData calldata metadata,
        Bond.Settings calldata configuration,
        Bond.TimeLockRewardPool[] calldata rewards,
        address treasury
    ) external override whenNotPaused returns (address) {
        SingleCollateralMultiRewardBond bond = new SingleCollateralMultiRewardBond();

        emit CreateBond(
            address(bond),
            metadata,
            configuration,
            rewards,
            treasury,
            _msgSender()
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

    function setTokenSweepBeneficiary(address newBeneficiary)
        external
        whenNotPaused
        onlySuperUserRole
    {
        _setTokenSweepBeneficiary(newBeneficiary);
    }

    /**
     * @notice Resumes all paused side affecting functions.
     */
    function unpause() external whenPaused atLeastSysAdminRole {
        _unpause();
    }

    function sweepERC20Tokens(address tokens, uint256 amount)
        external
        whenNotPaused
        onlySuperUserRole
    {
        _sweepERC20Tokens(tokens, amount);
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
