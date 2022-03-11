// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./FixedStakingPoolFactory.sol";
import "./FloatingStakingPoolFactory.sol";
import "./StakingPoolInfo.sol";
import "../RoleAccessControl.sol";

contract DaoStakingFactory is
    RoleAccessControl,
    FixedStakingPoolFactory,
    FloatingStakingPoolFactory
{
    function pause() external whenNotPaused atLeastSysAdminRole {
        _pause();
    }

    function unpause() external whenPaused atLeastSysAdminRole {
        _unpause();
    }

    function initialize() public {
        __FixedStakingPoolFactory_init();
        __FloatingStakingPoolFactory_init();
        __RoleAccessControl_init();
    }

    function createFixedStakingPool(
        uint256 daoId,
        StakingPoolInfo.StakingPoolData calldata _info
    ) public override atLeastDaoAminRole(daoId) returns (address) {
        return super.createFixedStakingPool(daoId, _info);
    }

    function createFloatingStakingPool(
        uint256 daoId,
        StakingPoolInfo.StakingPoolData calldata _info
    ) public override atLeastDaoAminRole(daoId) returns (address) {
        return super.createFloatingStakingPool(daoId, _info);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        atLeastSysAdminRole
    {}
}
