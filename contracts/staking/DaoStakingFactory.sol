// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

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
        StakingPoolInfo.StakingPoolData calldata _info
    ) external atLeastDaoAminRole(daoId) returns (address) {
        FixedStakingPool fixedStakingPool = new FixedStakingPool();

        emit StakingPoolInfo.StakingPoolCreated(
            address(fixedStakingPool),
            _info.treasury,
            _msgSender(),
            _info.rewardTokens,
            address(_info.stakeToken),
            _info.epochStartTimestamp,
            _info.epochDuration,
            _info.minimumContribution,
            StakingPoolInfo.StakingPoolType.FIXED
        );

        fixedStakingPool.initialize(_info);

        return address(fixedStakingPool);
    }

    function createFloatingStakingPool(
        uint256 daoId,
        StakingPoolInfo.StakingPoolData calldata _info
    ) external atLeastDaoAminRole(daoId) returns (address) {
        FloatingStakingPool floatingStakingPool = new FloatingStakingPool();

        emit StakingPoolInfo.StakingPoolCreated(
            address(floatingStakingPool),
            _info.treasury,
            _msgSender(),
            _info.rewardTokens,
            address(_info.stakeToken),
            _info.epochStartTimestamp,
            _info.epochDuration,
            _info.minimumContribution,
            StakingPoolInfo.StakingPoolType.FLOATING
        );

        floatingStakingPool.initialize(_info);

        return address(floatingStakingPool);
    }

    function initialize() public {
        __Pausable_init();
        __RoleAccessControl_init();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        virtual
        atLeastSysAdminRole
    {}
}
