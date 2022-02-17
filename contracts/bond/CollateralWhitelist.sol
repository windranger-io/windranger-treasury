// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMapUpgradeable.sol";

/**
 * @title Whitelist for collateral tokens.
 *
 * @notice Encapsulation of a ERC20 collateral tokens whitelist, indexed by their symbol.
 */
abstract contract CollateralWhitelist is Initializable {
    using EnumerableMapUpgradeable for EnumerableMapUpgradeable.UintToAddressMap;

    // Token symbols to ERC20 Token contract addresses
    EnumerableMapUpgradeable.UintToAddressMap private _whitelist;

    /**
     * @notice Returns an array of all currently whitelisted symbols
     */
    function whitelistedSymbols() external view returns (bytes32[] memory) {
        return _whitelist._inner._keys._inner._values;
    }

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
        return _whitelist.get(stringToUint256(symbol));
    }

    /**
     * @notice Whether the symbol has been whitelisted.
     */
    function isCollateralWhitelisted(string memory symbol)
        public
        view
        returns (bool)
    {
        return _whitelist.contains(stringToUint256(symbol));
    }

    // this is likely dangerous
    function stringToUint256(string memory source)
        public
        pure
        returns (uint256 result)
    {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
        result = uint256(result);
    }

    function __CollateralWhitelist_init() internal onlyInitializing {}

    /**
     * @notice Performs whitelisting of the ERC20 collateral token.
     *
     * @dev Whitelists the collateral token, expecting the symbol is not already whitelisted.
     *
     * Reverts if address is zero or the symbol already has a mapped address, or does not implement `symbol()`.
     */
    function _whitelistCollateral(address erc20CollateralToken) internal {
        _requireNonZeroAddress(erc20CollateralToken);

        string memory symbol = IERC20MetadataUpgradeable(erc20CollateralToken)
            .symbol();
        require(!isCollateralWhitelisted(symbol), "Whitelist: already present");
        _whitelist.set(stringToUint256(symbol), erc20CollateralToken);
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
            _whitelist.get(stringToUint256(symbol)) != erc20CollateralTokens,
            "Whitelist: identical address"
        );
        _whitelist.set(stringToUint256(symbol), erc20CollateralTokens);
    }

    /**
     * @notice Deletes a collateral token entry from the whitelist.
     *
     * @dev Expects the symbol to be an existing entry, otherwise reverts.
     */
    function _removeWhitelistedCollateral(string memory symbol) internal {
        require(isCollateralWhitelisted(symbol), "Whitelist: not whitelisted");
        _whitelist.remove(stringToUint256(symbol));
    }

    /**
     * @dev Reverts when the address is the zero address.
     */
    function _requireNonZeroAddress(address examine) private pure {
        require(examine != address(0), "Whitelist: zero address");
    }
}
