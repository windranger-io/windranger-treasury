// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

abstract contract DaoBondCollateralWhitelist {
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
        return _daoCollateralWhitelist(daoId)[symbol];
    }

    /**
     * @notice Whether the symbol has been whitelisted.
     */
    function isCollateralWhitelisted(uint256 daoId, string memory symbol)
        public
        view
        returns (bool)
    {
        return _daoCollateralWhitelist(daoId)[symbol] != address(0);
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
        require(_isValidDaoId(daoId), "DAO Collateral: invalid DAO id");
        require(
            erc20CollateralTokens != address(0),
            "DAO Collateral: zero address"
        );

        string memory symbol = IERC20MetadataUpgradeable(erc20CollateralTokens)
            .symbol();
        require(
            _daoCollateralWhitelist(daoId)[symbol] == address(0),
            "DAO Collateral: already present"
        );
        _daoCollateralWhitelist(daoId)[symbol] = erc20CollateralTokens;
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
        require(_isValidDaoId(daoId), "DAO Collateral: invalid DAO id");
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
            _daoCollateralWhitelist(daoId)[symbol] != erc20CollateralTokens,
            "DAO Collateral: same address"
        );
        _daoCollateralWhitelist(daoId)[symbol] = erc20CollateralTokens;
    }

    /**
     * @notice Deletes a collateral token entry from the whitelist.
     *
     * @dev Expects the symbol to be an existing entry, otherwise reverts.
     */
    function _removeWhitelistedCollateral(uint256 daoId, string memory symbol)
        internal
    {
        require(_isValidDaoId(daoId), "DAO Collateral: invalid DAO id");
        require(
            isCollateralWhitelisted(daoId, symbol),
            "DAO Collateral: not whitelisted"
        );
        delete _daoCollateralWhitelist(daoId)[symbol];
    }

    /**
     * @notice Provides access to the internal storage for the whitelist of collateral tokens for a single DAO.
     *
     * @dev Although a view modifier, the underlying storage may be altered, as in this case the view restriction
     *         applies to the reference rather than the addresses.
     */
    //slither-disable-next-line dead-code
    function _daoCollateralWhitelist(uint256 daoId)
        internal
        view
        virtual
        returns (mapping(string => address) storage);

    /**
     * @notice Whether a given DAO is currently associated with a live DAO.
     *
     * @dev At any moment, expect a range of IDs that have been assigned, with the possibility some DAOs within being
     *          deleted.
     */
    //slither-disable-next-line dead-code
    function _isValidDaoId(uint256 daoId) internal view virtual returns (bool);
}
