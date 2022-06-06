// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./StakingPool.sol";
import "./StakingPoolLib.sol";
import "../RoleAccessControl.sol";
import "../Version.sol";

import "hardhat/console.sol";

contract StakingPoolFactory is RoleAccessControl, PausableUpgradeable, Version {
    event StakingPoolCreated(
        address indexed stakingPool,
        address treasury,
        address indexed creator,
        StakingPoolLib.Reward[] rewardTokens,
        address stakeToken,
        uint128 epochStartTimestamp,
        uint128 epochDuration,
        uint128 minimumContribution,
        StakingPoolLib.RewardType rewardType
    );

    function pause() external whenNotPaused atLeastSysAdminRole {
        _pause();
    }

    function unpause() external whenPaused atLeastSysAdminRole {
        _unpause();
    }

    function createStakingPool(
        StakingPoolLib.Config calldata config,
        bool launchPaused,
        uint32 rewardsAvailableTimestamp
    )
        external
        whenNotPaused
        atLeastDaoAdminRole(config.daoId) // do we need this?
        returns (address)
    {
        StakingPool stakingPool = new StakingPool();
        console.log("factory new staking pool");

        emit StakingPoolCreated(
            address(stakingPool),
            config.treasury,
            _msgSender(),
            config.rewardTokens,
            address(config.stakeToken),
            config.epochStartTimestamp,
            config.epochDuration,
            config.minimumContribution,
            config.rewardType
        );
        console.log("factory initializing");
        stakingPool.initialize(config, launchPaused, rewardsAvailableTimestamp);
        console.log("factory transfer ownership");
        stakingPool.transferOwnership(_msgSender());
        console.log("factory ownership transferred");
        return address(stakingPool);
    }

    function initialize() external initializer {
        __Pausable_init();
        __RoleAccessControl_init();
    }
}
