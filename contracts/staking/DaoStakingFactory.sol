// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./FixedStakingPoolFactory.sol";
import "./FloatingStakingPoolFactory.sol";
import "./StakingPoolInfo.sol";
import "./StakingAccessControl.sol";

interface DaoWhitelist {
    function daoTreasury(uint256 daoId) external view returns (address);
}

contract DaoStakingFactory is
    FixedStakingPoolFactory,
    FloatingStakingPoolFactory
{
    DaoWhitelist public daoWhitelist;

    function setDaoWhitelist(DaoWhitelist _daoWhitelist)
        external
        onlyRole(Roles.DAO_ADMIN)
    {
        daoWhitelist = _daoWhitelist;
    }

    function pause() external whenNotPaused onlyRole(Roles.DAO_ADMIN) {
        _pause();
    }

    function unpause() external whenPaused onlyRole(Roles.DAO_ADMIN) {
        _unpause();
    }

    function initialize(DaoWhitelist _daoWhitelist) public {
        __FixedStakingPoolFactory_init();
        __FloatingStakingPoolFactory_init();
        __StakingAccessControl_init();
        daoWhitelist = _daoWhitelist;
    }

    function createFixedStakingPool(
        uint256 daoId,
        StakingPoolInfo.StakingPoolData calldata _info
    ) public daoRole(daoId, Roles.DAO_MEEPLE) returns (address) {
        require(
            daoWhitelist.daoTreasury(daoId) == _info.treasury,
            "Treasury is not whitelisted"
        );

        return super.createFixedStakingPool(_info);
    }

    function createFloatingStakingPool(
        uint256 daoId,
        StakingPoolInfo.StakingPoolData calldata _info
    ) public daoRole(daoId, Roles.DAO_MEEPLE) returns (address) {
        require(
            daoWhitelist.daoTreasury(daoId) == _info.treasury,
            "Treasury is not whitelisted"
        );

        return super.createFloatingStakingPool(_info);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(Roles.SYSTEM_ADMIN)
    {}
}
