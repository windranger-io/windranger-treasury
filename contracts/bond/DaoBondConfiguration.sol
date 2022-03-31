// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./DaoBondCollateralWhitelist.sol";

abstract contract DaoBondConfiguration is DaoBondCollateralWhitelist {
    struct DaoBondConfig {
        // Address zero is an invalid address, can be used to identify null structs
        address treasury;
        string metaData;
        CollateralWhitelist whitelist;
    }

    mapping(uint256 => DaoBondConfig) private _daoConfig;
    uint256 private _daoConfigLastId;

    event SetDaoTreasury(
        uint256 indexed daoId,
        address indexed treasury,
        address indexed instigator
    );

    event SetMetaData(
        uint256 indexed daoId,
        string data,
        address indexed instigator
    );

    function daoTreasury(uint256 daoId) external view returns (address) {
        return _daoConfig[daoId].treasury;
    }

    function daoMetaData(uint256 daoId) external view returns (string memory) {
        return _daoConfig[daoId].metaData;
    }

    function highestDaoId() external view returns (uint256) {
        return _daoConfigLastId;
    }

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
        require(
            erc20CapableTreasury != address(0),
            "DAO Treasury: address is zero"
        );

        _daoConfigLastId++;

        _setTreasury(_daoConfigLastId, erc20CapableTreasury);

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
        _setTreasury(daoId, replacementTreasury);
    }

    function _setDaoMetaData(uint256 daoId, string calldata replacementMetaData)
        internal
    {
        _daoConfig[daoId].metaData = replacementMetaData;
        emit SetMetaData(daoId, replacementMetaData, _msgSender());
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

    function _setTreasury(uint256 daoId, address treasury) private {
        _daoConfig[daoId].treasury = treasury;
        emit SetDaoTreasury(daoId, treasury, _msgSender());
    }
}
