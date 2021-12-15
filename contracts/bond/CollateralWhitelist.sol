// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title Whitelist for collateral tokens.
 *
 * @notice Encapsulation of a ERC20 collateral tokens whitelist, indexed by their symbol.
 */
abstract contract CollateralWhitelist is Initializable {
    // Token symbols to ERC20 Token contract addresses
    mapping(string => address) private _whitelist;

    /**
     * @notice The whitelisted ERC20 token address associated for a symbol.
     *
     * @return When present in the whitelist, the token address, otherwise address zero.
     */
    function whitelistedCollateralAddress(string calldata symbol)
        public
        view
        returns (address)
    {
        return _whitelist[symbol];
    }

    /**
     * @notice Whether the symbol has been whitelisted.
     */
    function isCollateralWhitelisted(string memory symbol)
        public
        view
        returns (bool)
    {
        return _whitelist[symbol] != address(0);
    }

    function __CollateralWhitelist_init() internal onlyInitializing {}

    /**
     * @notice Performs whitelisting of the ERC20 collateral token.
     *
     * @dev Whitelists the collateral token, expecting the symbol is not already whitelisted.
     *
     * Reverts if address is zero or the symbol already has a mapped address, or does not implement `symbol()`.
     */
    function _whitelistCollateral(address erc20CollateralTokens) internal {
        _requireNonZeroAddress(erc20CollateralTokens);

        string memory symbol = IERC20MetadataUpgradeable(erc20CollateralTokens)
            .symbol();
        require(_whitelist[symbol] == address(0), "Whitelist: already present");
        _whitelist[symbol] = erc20CollateralTokens;
    }

    /**
     * @notice Updates an already whitelisted address.
     *
     * @dev Reverts if the address is zero, is identical to the current address, or does not implement `symbol()`.
     */
    function _updateWhitelistedCollateral(address erc20CollateralTokens)
        internal
    {
        _requireNonZeroAddress(erc20CollateralTokens);

        string memory symbol = IERC20MetadataUpgradeable(erc20CollateralTokens)
            .symbol();
        require(isCollateralWhitelisted(symbol), "Whitelist: not whitelisted");
        require(
            _whitelist[symbol] != erc20CollateralTokens,
            "Whitelist: identical address"
        );
        _whitelist[symbol] = erc20CollateralTokens;
    }

    /**
     * @notice Deletes a collateral token entry from the whitelist.
     *
     * @dev Expects the symbol to be an existing entry, otherwise reverts.
     */
    function _removeWhitelistedCollateral(string memory symbol) internal {
        require(isCollateralWhitelisted(symbol), "Whitelist: not whitelisted");
        delete _whitelist[symbol];
    }

    /**
     * @dev Reverts when the address is the zero address.
     */
    function _requireNonZeroAddress(address examine) private pure {
        require(examine != address(0), "Whitelist: zero address");
    }
}
