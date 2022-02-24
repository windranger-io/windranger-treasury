// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "./DaoBondCollateralWhitelist.sol";

abstract contract DaoBondConfiguration is
    DaoBondCollateralWhitelist,
    Initializable
{
    struct DaoBondConfig {
        // Address zero is an invalid address, can be used to identify null structs
        address treasury;
        // Token symbols to ERC20 Token contract addresses
        mapping(string => address) whitelist;
    }

    mapping(uint256 => DaoBondConfig) private _daoConfig;
    uint256 private _daoConfigLastId;

    function treasury(uint256 daoId) external view returns (address) {
        return _daoConfig[daoId].treasury;
    }

    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     */
    function __DaoBondConfiguration_init() internal onlyInitializing {}

    function _daoBondConfiguration(address erc20CapableTreasury)
        internal
        returns (uint256)
    {
        require(
            erc20CapableTreasury != address(0),
            "DAO Treasury: address is zero"
        );

        _daoConfigLastId++;

        DaoBondConfig storage config = _daoConfig[_daoConfigLastId];
        config.treasury = erc20CapableTreasury;

        return _daoConfigLastId;
    }

    function _daoTreasury(uint256 id) internal returns (address) {
        return _daoConfig[id].treasury;
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
        returns (mapping(string => address) storage)
    {
        return _daoConfig[daoId].whitelist;
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
