// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

abstract contract DaoBondConfiguration is Initializable {
    struct DaoBondConfig {
        // Address zero is an invalid address, can be used to identify null structs
        address treasury;
        // Token symbols to ERC20 Token contract addresses
        mapping(string => address) whitelist;
    }

    mapping(uint256 => DaoBondConfig) private _daoConfig;
    uint256 private _daoConfigLastId;

    /**
     * @notice The whitelisted ERC20 token address associated for a symbol.
     *
     * @return When present in the whitelist, the token address, otherwise address zero.
     */
    function whitelistedCollateralAddress(uint256 daoId, string calldata symbol)
        external
        view
        returns (address)
    {
        return _daoConfig[daoId].whitelist[symbol];
    }

    function treasury(uint256 daoId) external view returns (address) {
        return _daoConfig[daoId].treasury;
    }

    /**
     * @notice Whether the symbol has been whitelisted.
     */
    function isCollateralWhitelisted(uint256 daoId, string memory symbol)
        public
        view
        returns (bool)
    {
        return _daoConfig[daoId].whitelist[symbol] != address(0);
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

    function _isValidDaoId(uint256 id) internal returns (bool) {
        return id <= _daoConfigLastId && _daoConfig[id].treasury != address(0);
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

    /**
     * @notice Performs whitelisting of the ERC20 collateral token.
     *
     * @dev Whitelists the collateral token, expecting the symbol is not already whitelisted.
     *
     * Reverts if address is zero or the symbol already has a mapped address, or does not implement `symbol()`.
     */
    function _whitelistCollateral(uint256 daoId, address erc20CollateralTokens)
        internal
    {
        require(
            erc20CollateralTokens != address(0),
            "DAO Collateral: zero address"
        );

        string memory symbol = IERC20MetadataUpgradeable(erc20CollateralTokens)
            .symbol();
        require(
            _daoConfig[daoId].whitelist[symbol] == address(0),
            "DAO Collateral: already present"
        );
        _daoConfig[daoId].whitelist[symbol] = erc20CollateralTokens;
    }

    /**
     * @notice Updates an already whitelisted address.
     *
     * @dev Reverts if the address is zero, is identical to the current address, or does not implement `symbol()`.
     */
    function _updateWhitelistedCollateral(
        uint256 daoId,
        address erc20CollateralTokens
    ) internal {
        require(
            erc20CollateralTokens != address(0),
            "DAO Collateral: zero address"
        );

        string memory symbol = IERC20MetadataUpgradeable(erc20CollateralTokens)
            .symbol();
        require(
            isCollateralWhitelisted(daoId, symbol),
            "DAO Collateral: not whitelisted"
        );
        require(
            _daoConfig[daoId].whitelist[symbol] != erc20CollateralTokens,
            "DAO Collateral: same address"
        );
        _daoConfig[daoId].whitelist[symbol] = erc20CollateralTokens;
    }

    /**
     * @notice Deletes a collateral token entry from the whitelist.
     *
     * @dev Expects the symbol to be an existing entry, otherwise reverts.
     */
    function _removeWhitelistedCollateral(uint256 daoId, string memory symbol)
        internal
    {
        require(
            isCollateralWhitelisted(daoId, symbol),
            "DAO Collateral: not whitelisted"
        );
        delete _daoConfig[daoId].whitelist[symbol];
    }
}
