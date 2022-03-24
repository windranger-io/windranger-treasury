// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./StakingPool.sol";
import "./StakingPoolLib.sol";
import "../RoleAccessControl.sol";

contract StakingPoolFactory is RoleAccessControl, PausableUpgradeable {
    //todo: refactor to emit StakingPoolLib.Data struct
    event StakingPoolCreated(
        address indexed stakingPool,
        address treasury,
        address indexed creator,
        StakingPoolLib.RewardToken[] rewardTokens,
        address stakeToken,
        uint128 epochStartTimestamp,
        uint128 epochDuration,
        uint128 minimumContribution,
        StakingPoolLib.StakingPoolType poolType
    );

    function pause() external whenNotPaused atLeastSysAdminRole {
        _pause();
    }

    function unpause() external whenPaused atLeastSysAdminRole {
        _unpause();
    }

    function createStakingPool(StakingPoolLib.Data calldata info)
        external
        whenNotPaused
        atLeastDaoAminRole(info.daoId)
        returns (address)
    {
        StakingPool stakingPool = new StakingPool();

        emit StakingPoolCreated(
            address(stakingPool),
            info.treasury,
            _msgSender(),
            info.rewardTokens,
            address(info.stakeToken),
            info.epochStartTimestamp,
            info.epochDuration,
            info.minimumContribution,
            info.poolType
        );

        stakingPool.initialize(info);
        return address(stakingPool);
    }

    function initialize() external initializer {
        __Pausable_init();
        __RoleAccessControl_init();
    }
}
