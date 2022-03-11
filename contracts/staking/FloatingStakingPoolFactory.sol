// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "../Roles.sol";

import "./FloatingStakingPool.sol";
import "./StakingPoolInfo.sol";
import "../RoleAccessControl.sol";

abstract contract FloatingStakingPoolFactory is
    RoleAccessControl,
    PausableUpgradeable,
    UUPSUpgradeable
{
    event FloatingStakingPoolCreated(
        address indexed stakingPool,
        address treasury,
        address indexed creator,
        StakingPoolInfo.RewardToken[] rewardTokens,
        address stakeToken,
        uint128 epochStartTimestamp,
        uint128 rewardUnlockTimestamp,
        uint128 epochDuration,
        uint128 minimumContribution
    );

    // solhint-disable-next-line
    function __FloatingStakingPoolFactory_init() public virtual initializer {
        __RoleAccessControl_init();
        __UUPSUpgradeable_init();
    }

    function createFloatingStakingPool(
        uint256 daoId,
        StakingPoolInfo.StakingPoolData calldata _info
    ) public virtual whenNotPaused atLeastDaoAminRole(daoId) returns (address) {
        FloatingStakingPool floatingStakingPool = new FloatingStakingPool();

        emit FloatingStakingPoolCreated(
            address(floatingStakingPool),
            _info.treasury,
            _msgSender(),
            _info.rewardTokens,
            address(_info.stakeToken),
            _info.epochStartTimestamp,
            _info.rewardUnlockTimestamp,
            _info.epochDuration,
            _info.minimumContribution
        );

        floatingStakingPool.initialize(_info);

        return address(floatingStakingPool);
    }
}
