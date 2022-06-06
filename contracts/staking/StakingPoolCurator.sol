// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "../RoleAccessControl.sol";
import "./StakingPool.sol";
import "./StakingPoolLib.sol";

/**
 * @title Manages interactions with StakingPool contracts.
 *
 * @notice A central place to discover created StakingPools and apply access control to them.
 *
 * @dev Owns of all StakingPools it manages, guarding function accordingly allows finer access control to be provided.
 */
abstract contract StakingPoolCurator is RoleAccessControl, PausableUpgradeable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    mapping(uint256 => EnumerableSetUpgradeable.AddressSet)
        private _stakingPools;

    event AddStakingPool(
        uint256 indexed daoId,
        address indexed stakingPool,
        address indexed instigator
    );

    function stakingPoolPause(uint256 daoId, address stakingPool)
        external
        whenNotPaused
        atLeastDaoAdminRole(daoId)
    {
        _requireManagingStakingPool(daoId, stakingPool);

        StakingPool(stakingPool).pause();
    }

    function stakingPoolUnpause(uint256 daoId, address stakingPool)
        external
        whenNotPaused
        atLeastDaoAdminRole(daoId)
    {
        _requireManagingStakingPool(daoId, stakingPool);

        StakingPool(stakingPool).unpause();
    }

    function stakingPoolInitializeRewardTokens(
        uint256 daoId,
        address stakingPool,
        address benefactor,
        StakingPoolLib.Reward[] calldata rewards
    ) external whenNotPaused atLeastDaoMeepleRole(daoId) {
        _requireManagingStakingPool(daoId, stakingPool);

        StakingPool(stakingPool).initializeRewardTokens(benefactor, rewards);
    }

    function stakingPoolEnableEmergencyMode(uint256 daoId, address stakingPool)
        external
        atLeastDaoMeepleRole(daoId)
    {
        _requireManagingStakingPool(daoId, stakingPool);

        StakingPool(stakingPool).enableEmergencyMode();
    }

    function stakingPoolAdminEmergencyRewardSweep(
        uint256 daoId,
        address stakingPool
    ) external atLeastDaoMeepleRole(daoId) {
        _requireManagingStakingPool(daoId, stakingPool);

        StakingPool(stakingPool).adminEmergencyRewardSweep();
    }

    function stakingPoolSetRewardsAvailableTimestamp(
        uint256 daoId,
        address stakingPool,
        uint32 timestamp
    ) external atLeastDaoMeepleRole(daoId) {
        _requireManagingStakingPool(daoId, stakingPool);

        StakingPool(stakingPool).setRewardsAvailableTimestamp(timestamp);
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

    function stakingPoolAt(uint256 daoId, uint256 index)
        external
        view
        returns (address)
    {
        require(
            index < EnumerableSetUpgradeable.length(_stakingPools[daoId]),
            "StakingPool: too large"
        );

        return EnumerableSetUpgradeable.at(_stakingPools[daoId], index);
    }

    function stakingPoolCount(uint256 daoId) external view returns (uint256) {
        return EnumerableSetUpgradeable.length(_stakingPools[daoId]);
    }

    function _addStakingPool(uint256 daoId, address stakingPool)
        internal
        whenNotPaused
    {
        require(
            !_stakingPools[daoId].contains(stakingPool),
            "StakingPool: already managing"
        );
        require(
            OwnableUpgradeable(stakingPool).owner() == address(this),
            "StakingPool: not owner"
        );

        emit AddStakingPool(daoId, stakingPool, _msgSender());

        bool added = _stakingPools[daoId].add(stakingPool);
        require(added, "StakingPool: failed to add");
    }

    //slither-disable-next-line naming-convention
    function __StakingPoolCurator_init() internal onlyInitializing {
        __RoleAccessControl_init();
        __Pausable_init();
    }

    function _requireManagingStakingPool(uint256 daoId, address stakingPool)
        private
        view
    {
        require(
            _stakingPools[daoId].contains(stakingPool),
            "StakingPool: not managing"
        );
    }
}
