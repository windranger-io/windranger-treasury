// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./DaoBondCollateralWhitelist.sol";
import "../Dao.sol";

abstract contract DaoBondConfiguration is DaoBondCollateralWhitelist, Dao {
    struct DaoBondConfig {
        // Address zero is an invalid address, can be used to identify null structs
        // address treasury;

        DaoConfig dao;
        CollateralWhitelist whitelist;
    }

    mapping(uint256 => DaoBondConfig) private _daoBondConfig;

    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     */
    //slither-disable-next-line naming-convention
    function __DaoBondConfiguration_init() internal onlyInitializing {
        __DaoBondCollateralWhitelist_init();
    }

    function _daoBondConfiguration(address erc20CapableTreasury)
        internal
        returns (uint256)
    {
        uint256 daoId = _daoConfiguration(erc20CapableTreasury);

        DaoBondConfig storage config = _daoBondConfig[daoId];
        config.dao.treasury = erc20CapableTreasury;
    }
    function _setDaoTreasury(uint256 daoId, address replacementTreasury)
        internal
    {
        require(_isValidDaoId(daoId), "DAO Treasury: invalid DAO Id");
        require(
            replacementTreasury != address(0),
            "DAO Treasury: address is zero"
        );
        require(
            _daoConfig[daoId].treasury != replacementTreasury,
            "DAO Treasury: identical address"
        );
        _daoConfig[daoId].treasury = replacementTreasury;
    }

    function _daoCollateralWhitelist(uint256 daoId)
        internal
        view
        override
        returns (CollateralWhitelist storage)
    {
        return _daoConfig[daoId].whitelist;
    }

    function _daoTreasury(uint256 daoId) internal view returns (address) {
        return _daoConfig[daoId].treasury;
    }

    function _isValidDaoId(uint256 daoId)
        internal
        view
        override
        returns (bool)
    {
        return _daoConfig[daoId].treasury != address(0);
    }
}
