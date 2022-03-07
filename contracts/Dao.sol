// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

abstract contract Dao {
    struct DaoConfig {
        // Address zero is an invalid address, can be used to identify null structs
        address treasury;
    }

    mapping(uint256 => DaoConfig) private _daoConfig;
    uint256 private _daoConfigLastId;

    function daoTreasury(uint256 daoId)
        external
        view
        virtual
        returns (address)
    {
        return _daoConfig[daoId].treasury;
    }

    // create a new dao with a treasury address
    function _daoConfiguration(address erc20CapableTreasury)
        internal
        returns (uint256)
    {
        require(
            erc20CapableTreasury != address(0),
            "DAO Treasury: address is zero"
        );

        _daoConfigLastId++;

        DaoConfig storage config = _daoConfig[_daoConfigLastId]; // do we need to do this?
        config.treasury = erc20CapableTreasury;

        return _daoConfigLastId;
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

    function _daoTreasury(uint256 daoId) internal view returns (address) {
        return _daoConfig[daoId].treasury;
    }

    function _isValidDaoId(uint256 daoId) internal view returns (bool) {
        return _daoConfig[daoId].treasury != address(0);
    }
}
