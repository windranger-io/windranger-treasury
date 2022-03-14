// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./FixedStakingPool.sol";
import "./FloatingStakingPool.sol";
import "./StakingPoolInfo.sol";
import "../RoleAccessControl.sol";

contract DaoStakingFactory is RoleAccessControl, PausableUpgradeable {
    function pause() external whenNotPaused atLeastSysAdminRole {
        _pause();
    }

    function unpause() external whenPaused atLeastSysAdminRole {
        _unpause();
    }

    function createFixedStakingPool(
        uint256 daoId,
        StakingPoolInfo.StakingPoolData calldata info
    ) external atLeastDaoAminRole(daoId) returns (address) {
        FixedStakingPool fixedStakingPool = new FixedStakingPool();

        emit StakingPoolInfo.StakingPoolCreated(
            address(fixedStakingPool),
            info.treasury,
            _msgSender(),
            info.rewardTokens,
            address(info.stakeToken),
            info.epochStartTimestamp,
            info.epochDuration,
            info.minimumContribution,
            StakingPoolInfo.StakingPoolType.FIXED
        );

        fixedStakingPool.initialize(info);

        return address(fixedStakingPool);
    }

    function createFloatingStakingPool(
        uint256 daoId,
        StakingPoolInfo.StakingPoolData calldata info
    ) external atLeastDaoAminRole(daoId) returns (address) {
        FloatingStakingPool floatingStakingPool = new FloatingStakingPool();

        emit StakingPoolInfo.StakingPoolCreated(
            address(floatingStakingPool),
            info.treasury,
            _msgSender(),
            info.rewardTokens,
            address(info.stakeToken),
            info.epochStartTimestamp,
            info.epochDuration,
            info.minimumContribution,
            StakingPoolInfo.StakingPoolType.FLOATING
        );

        floatingStakingPool.initialize(info);

        return address(floatingStakingPool);
    }

    function initialize() external initializer {
        __Pausable_init();
        __RoleAccessControl_init();
    }
}
