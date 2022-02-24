// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

/**
 * @title Whitelist for collateral tokens.
 *
 * @notice Encapsulation of a ERC20 collateral tokens whitelist, indexed by their symbol.
 */
abstract contract CollateralWhitelist is Initializable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    EnumerableSetUpgradeable.AddressSet private _whitelist;

    // Token symbols to ERC20 Token contract addresses
    mapping(address => string) private _symbols;

    /**
     * @notice Returns a list of the whitelisted tokens' symbols
     */
    function whitelistSymbols() external view returns (string[] memory) {
        address[] memory keys = _whitelist.values();
        string[] memory symbols = new string[](keys.length);
        for (uint256 i = 0; i < keys.length; i++) {
            symbols[i] = _symbols[keys[i]];
        }
        return symbols;
    }

    /**
     * @notice Whether the symbol has been whitelisted.
     */
    function isCollateralWhitelisted(address erc20) public view returns (bool) {
        return _whitelist.contains(erc20);
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
        require(
            !isCollateralWhitelisted(erc20CollateralTokens),
            "Whitelist: already present"
        );
        require(_whitelist.add(erc20CollateralTokens), "Whitelist: cannot add");

        _symbols[erc20CollateralTokens] = symbol;
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
        require(
            isCollateralWhitelisted(erc20CollateralTokens),
            "Whitelist: not whitelisted"
        );

        bytes32 storedSymbolHash = keccak256(
            abi.encode(_symbols[erc20CollateralTokens])
        );
        bytes32 symbolHash = keccak256(abi.encode(symbol));

        require(storedSymbolHash != symbolHash, "Whitelist: same symbol");
        require(_whitelist.add(erc20CollateralTokens), "Whitelist: cannot add");

        _symbols[erc20CollateralTokens] = symbol;
    }

    /**
     * @notice Deletes a collateral token entry from the whitelist.
     *
     * @dev Expects the symbol to be an existing entry, otherwise reverts.
     */
    function _removeWhitelistedCollateral(address erc20) internal {
        require(isCollateralWhitelisted(erc20), "Whitelist: not whitelisted");
        require(_whitelist.remove(erc20), "Whitelist: cannot remove");
        delete _symbols[erc20];
    }

    /**
     * @dev Reverts when the address is the zero address.
     */
    function _requireNonZeroAddress(address examine) private pure {
        require(examine != address(0), "Whitelist: zero address");
    }
}
