// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "../RoleAccessControl.sol";
import "./SingleCollateralPerformanceBond.sol";

/**
 * @title Manages interactions with Performance Bond contracts.
 *
 * @notice A central place to discover created Performance Bonds and apply access control to them.
 *
 * @dev Owns of all Performance Bonds that it manages, with guarding function providing finer access control.
 */
abstract contract PerformanceBondCurator is
    RoleAccessControl,
    PausableUpgradeable
{
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    mapping(uint256 => EnumerableSetUpgradeable.AddressSet) private _bonds;

    event AddPerformanceBond(
        uint256 indexed daoId,
        address indexed bond,
        address indexed instigator
    );

    function performanceBondAllowRedemption(
        uint256 daoId,
        address bond,
        string calldata reason
    ) external whenNotPaused atLeastDaoMeepleRole(daoId) {
        _requireManagingBond(daoId, bond);

        SingleCollateralPerformanceBond(bond).allowRedemption(reason);
    }

    function performanceBondPause(uint256 daoId, address bond)
        external
        whenNotPaused
        atLeastDaoAdminRole(daoId)
    {
        _requireManagingBond(daoId, bond);

        SingleCollateralPerformanceBond(bond).pause();
    }

    function performanceBondSlash(
        uint256 daoId,
        address bond,
        uint256 amount,
        string calldata reason
    ) external whenNotPaused atLeastDaoMeepleRole(daoId) {
        _requireManagingBond(daoId, bond);

        SingleCollateralPerformanceBond(bond).slash(amount, reason);
    }

    function performanceBondSetMetaData(
        uint256 daoId,
        address bond,
        string calldata data
    ) external whenNotPaused atLeastDaoMeepleRole(daoId) {
        _requireManagingBond(daoId, bond);

        SingleCollateralPerformanceBond(bond).setMetaData(data);
    }

    function performanceBondSetTreasury(
        uint256 daoId,
        address bond,
        address replacement
    ) external whenNotPaused atLeastDaoAdminRole(daoId) {
        _requireManagingBond(daoId, bond);

        SingleCollateralPerformanceBond(bond).setTreasury(replacement);
    }

    function performanceBondSweepERC20Tokens(
        uint256 daoId,
        address bond,
        address tokens,
        uint256 amount
    ) external whenNotPaused atLeastDaoAdminRole(daoId) {
        _requireManagingBond(daoId, bond);

        SingleCollateralPerformanceBond(bond).sweepERC20Tokens(tokens, amount);
    }

    function performanceBondUpdateRewardTimeLock(
        uint256 daoId,
        address bond,
        address tokens,
        uint128 timeLock
    ) external whenNotPaused atLeastDaoAdminRole(daoId) {
        _requireManagingBond(daoId, bond);

        SingleCollateralPerformanceBond(bond).updateRewardTimeLock(
            tokens,
            timeLock
        );
    }

    function performanceBondUnpause(uint256 daoId, address bond)
        external
        whenNotPaused
        atLeastDaoAdminRole(daoId)
    {
        _requireManagingBond(daoId, bond);

        SingleCollateralPerformanceBond(bond).unpause();
    }

    function performanceBondWithdrawCollateral(uint256 daoId, address bond)
        external
        whenNotPaused
        atLeastDaoAdminRole(daoId)
    {
        _requireManagingBond(daoId, bond);

        SingleCollateralPerformanceBond(bond).withdrawCollateral();
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

    function performanceBondAt(uint256 daoId, uint256 index)
        external
        view
        returns (address)
    {
        require(
            index < EnumerableSetUpgradeable.length(_bonds[daoId]),
            "BondCurator: too large"
        );

        return EnumerableSetUpgradeable.at(_bonds[daoId], index);
    }

    function performanceBondCount(uint256 daoId)
        external
        view
        returns (uint256)
    {
        return EnumerableSetUpgradeable.length(_bonds[daoId]);
    }

    function _addBond(uint256 daoId, address bond) internal whenNotPaused {
        require(!_bonds[daoId].contains(bond), "BondCurator: already managing");
        require(
            OwnableUpgradeable(bond).owner() == address(this),
            "BondCurator: not bond owner"
        );

        emit AddPerformanceBond(daoId, bond, _msgSender());

        bool added = _bonds[daoId].add(bond);
        require(added, "BondCurator: failed to add");
    }

    //slither-disable-next-line naming-convention
    function __BondCurator_init() internal onlyInitializing {
        __RoleAccessControl_init();
        __Pausable_init();
    }

    function _requireManagingBond(uint256 daoId, address bond) private view {
        require(_bonds[daoId].contains(bond), "BondCurator: not managing");
    }
}
