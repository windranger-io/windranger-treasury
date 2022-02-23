// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract DaoBondConfiguration is Initializable {
    struct DaoBondConfig {
        /// Address zero is an invalid address, can be used to identify null structs
        address treasury;
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
            "DBC: treasury address is zero"
        );

        _daoConfigLastId++;

        _daoConfig[_daoConfigLastId] = DaoBondConfig({
            treasury: erc20CapableTreasury
        });

        return _daoConfigLastId;
    }

    function _daoTreasury(uint256 id) internal returns (address) {
        return _daoConfig[id].treasury;
    }

    function _isValidDaoId(uint256 id) internal returns (bool) {
        return id <= _daoConfigLastId && _daoConfig[id].treasury != address(0);
    }

    function _setDaoTreasury(uint256 daoId, address replacementTreasury)
        internal
    {
        require(_isValidDaoId(daoId), "DBC: invalid DAO Id");
        require(
            replacementTreasury != address(0),
            "DBC: treasury address is zero"
        );
        require(
            _daoConfig[daoId].treasury != replacementTreasury,
            "DBC: identical treasury address"
        );
        _daoConfig[daoId].treasury = replacementTreasury;
    }
}
