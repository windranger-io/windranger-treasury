// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./StakingPool.sol";
import "./StakingPoolLib.sol";
import "../RoleAccessControl.sol";

contract DaoStakingFactory is RoleAccessControl, PausableUpgradeable {
    event StakingPoolCreated(
        address indexed stakingPool,
        address treasury,
        address indexed creator,
        StakingPoolLib.RewardToken[] rewardTokens,
        address stakeToken,
        uint128 epochStartTimestamp,
        uint128 epochDuration,
        uint128 minimumContribution,
        StakingPoolLib.StakingPoolType stakingPoolType
    );

    function pause() external whenNotPaused atLeastSysAdminRole {
        _pause();
    }

    function unpause() external whenPaused atLeastSysAdminRole {
        _unpause();
    }

    function createStakingPool(uint256 daoId, StakingPoolLib.Data calldata info)
        external
        atLeastDaoAminRole(daoId)
        returns (address)
    {
        StakingPool floatingStakingPool = new StakingPool();

        emit StakingPoolCreated(
            address(floatingStakingPool),
            info.treasury,
            _msgSender(),
            info.rewardTokens,
            address(info.stakeToken),
            info.epochStartTimestamp,
            info.epochDuration,
            info.minimumContribution,
            StakingPoolLib.StakingPoolType.FLOATING
        );

        floatingStakingPool.initialize(info);

        return address(floatingStakingPool);
    }

    function initialize() external initializer {
        __Pausable_init();
        __RoleAccessControl_init();
    }
}
