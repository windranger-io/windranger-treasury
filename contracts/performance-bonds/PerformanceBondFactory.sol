// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./SingleCollateralMultiRewardPerformanceBond.sol";
import "./ERC20SingleCollateralPerformanceBond.sol";
import "../RoleAccessControl.sol";
import "./PerformanceBondCreator.sol";
import "../Roles.sol";
import "../Version.sol";
import "../sweep/SweepERC20.sol";

/**
 * @title Creates Performance Bond contracts.
 *
 * @dev An upgradable contract that encapsulates the Bond implementation and associated deployment cost.
 */
contract PerformanceBondFactory is
    PerformanceBondCreator,
    OwnableUpgradeable,
    PausableUpgradeable,
    SweepERC20,
    Version
{
    event CreatePerformanceBond(
        address indexed bond,
        PerformanceBond.MetaData metadata,
        PerformanceBond.Settings configuration,
        PerformanceBond.TimeLockRewardPool[] rewards,
        address indexed treasury,
        address indexed instigator
    );

    constructor(address treasury) initializer {
        __Ownable_init();
        __TokenSweep_init(treasury);
    }

    function createPerformanceBond(
        PerformanceBond.MetaData calldata metadata,
        PerformanceBond.Settings calldata configuration,
        PerformanceBond.TimeLockRewardPool[] calldata rewards,
        address treasury
    ) external override whenNotPaused returns (address) {
        SingleCollateralMultiRewardPerformanceBond bond = new SingleCollateralMultiRewardPerformanceBond();

        emit CreatePerformanceBond(
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
    function pause() external whenNotPaused onlyOwner {
        _pause();
    }

    function setTokenSweepBeneficiary(address newBeneficiary)
        external
        whenNotPaused
        onlyOwner
    {
        _setTokenSweepBeneficiary(newBeneficiary);
    }

    /**
     * @notice Resumes all paused side affecting functions.
     */
    function unpause() external whenPaused onlyOwner {
        _unpause();
    }

    function sweepERC20Tokens(address tokens, uint256 amount)
        external
        whenNotPaused
        onlyOwner
    {
        _sweepERC20Tokens(tokens, amount);
    }
}
