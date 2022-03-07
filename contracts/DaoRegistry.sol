// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Dao.sol";
import "./staking/Roles.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract DaoRegistry is AccessControlUpgradeable, Dao {
    // alternative way (outside of bonding) to create a DAO
    function createDao(address erc20CapableTreasury)
        external
        onlyRole(Roles.DAO_ADMIN)
    {
        _daoConfiguration(erc20CapableTreasury);
    }

    function daoTreasury(uint256 daoId)
        external
        view
        override(Dao)
        returns (address)
    {
        return super._daoTreasury(daoId);
    }
}
