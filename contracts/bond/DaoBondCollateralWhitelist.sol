// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

abstract contract DaoBondCollateralWhitelist is Initializable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    struct CollateralWhitelist {
        // Token symbols to ERC20 Token contract addresses
        EnumerableSetUpgradeable.AddressSet tokens;
        // Token symbols to ERC20 Token contract addresses
        mapping(address => string) symbols;
    }

    /**
     * @notice Returns a list of the whitelisted tokens' symbols
     *
     * @dev NOTE This is a convenience getter function, due to looking an unknown gas cost,
     *             never call within a transaction, only use a call from an EOA.
     */
    function whitelistSymbols(uint256 daoId)
        external
        view
        returns (string[] memory)
    {
        address[] memory keys = _daoCollateralWhitelist(daoId).tokens.values();
        string[] memory symbols = new string[](keys.length);
        for (uint256 i = 0; i < keys.length; i++) {
            symbols[i] = _daoCollateralWhitelist(daoId).symbols[keys[i]];
        }
        return symbols;
    }

    /**
     * @notice The whitelisted ERC20 token address associated for a symbol.
     *
     * @return When present in the whitelist, the token address, otherwise address zero.
     */
    function isCollateralWhitelisted(
        uint256 daoId,
        address erc20CollateralTokens
    ) public view returns (bool) {
        return _isWhitelistedToken(daoId, erc20CollateralTokens);
    }

    function __DaoBondCollateralWhitelist_init() internal onlyInitializing {}

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
        require(
            !_isWhitelistedToken(daoId, erc20CollateralTokens),
            "DAO Collateral: already present"
        );
        require(
            _daoCollateralWhitelist(daoId).tokens.add(erc20CollateralTokens),
            "DAO Collateral: failed to add"
        );

        _daoCollateralWhitelist(daoId).symbols[
            erc20CollateralTokens
        ] = IERC20MetadataUpgradeable(erc20CollateralTokens).symbol();
    }

    /**
     * @notice Deletes a collateral token entry from the whitelist.
     *
     * @dev Expects the symbol to be an existing entry, otherwise reverts.
     */
    function _removeWhitelistedCollateral(
        uint256 daoId,
        address erc20CollateralTokens
    ) internal {
        require(_isValidDaoId(daoId), "DAO Collateral: invalid DAO id");
        require(
            _isWhitelistedToken(daoId, erc20CollateralTokens),
            "DAO Collateral: not whitelisted"
        );
        require(
            _daoCollateralWhitelist(daoId).tokens.remove(erc20CollateralTokens),
            "DAO Collateral: failed to remove"
        );
        delete _daoCollateralWhitelist(daoId).symbols[erc20CollateralTokens];
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
        returns (CollateralWhitelist storage);

    /**
     * @notice Whether a given DAO is currently associated with a live DAO.
     *
     * @dev At any moment, expect a range of IDs that have been assigned, with the possibility some DAOs within being
     *          deleted.
     */
    //slither-disable-next-line dead-code
    function _isValidDaoId(uint256 daoId) internal view virtual returns (bool);

    function _isWhitelistedToken(uint256 daoId, address erc20CollateralTokens)
        private
        view
        returns (bool)
    {
        return
            _daoCollateralWhitelist(daoId).tokens.contains(
                erc20CollateralTokens
            );
    }
}
