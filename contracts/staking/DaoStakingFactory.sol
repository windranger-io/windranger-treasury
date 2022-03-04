// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./FixedStakingPoolFactory.sol";
import "./FloatingStakingPoolFactory.sol";
import "./StakingPoolInfo.sol";
import "./StakingAccessControl.sol";

interface DaoTreasuryWhitelist {
    function isWhitelistedTreasury(address treasury)
        external
        view
        returns (bool);
}

contract DaoStakingFactory is
    FixedStakingPoolFactory,
    FloatingStakingPoolFactory
{
    DaoTreasuryWhitelist public daoTreasuryWhitelist;

    function setDaoTreasuryWhitelist(DaoTreasuryWhitelist _daoTreasuryWhitelist)
        external
        onlyRole(Roles.DAO_ADMIN)
    {
        daoTreasuryWhitelist = _daoTreasuryWhitelist;
    }

    function pause() external whenNotPaused onlyRole(Roles.DAO_ADMIN) {
        _pause();
    }

    function unpause() external whenPaused onlyRole(Roles.DAO_ADMIN) {
        _unpause();
    }

    function initialize(DaoTreasuryWhitelist _daoTreasuryWhitelist) public {
        __FixedStakingPoolFactory_init();
        __FloatingStakingPoolFactory_init();
        __StakingAccessControl_init();
        daoTreasuryWhitelist = _daoTreasuryWhitelist;
    }

    function createFixedStakingPool(
        StakingPoolInfo.StakingPoolData calldata _info
    ) public override onlyRole(Roles.DAO_MEEPLE) returns (address) {
        require(
            daoTreasuryWhitelist.isWhitelistedTreasury(_info.treasury),
            "Treasury is not whitelisted"
        );
        return super.createFixedStakingPool(_info);
    }

    function createFloatingStakingPool(
        StakingPoolInfo.StakingPoolData calldata _info
    ) public override onlyRole(Roles.DAO_MEEPLE) returns (address) {
        require(
            daoTreasuryWhitelist.isWhitelistedTreasury(_info.treasury),
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
