// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
    @title Whitelist for collateral tokens.
    @dev Provides encapsulation of the ERC20 collateral tokens whitelist.
         This module is used through inheritance.
 */
abstract contract CollateralWhitelist is Initializable {
    /// Token symbols to ERC20 Token contract addresses
    mapping(string => address) private _whitelist;

    /**
        @notice Whitelisted ERC20 token address for the symbol.
        @dev Retrieves the address for the collateral token address, if it has been whitelisted, otherwise address zero.
     */
    function whitelistedCollateralAddress(string calldata symbol)
        public
        view
        returns (address)
    {
        return _whitelist[symbol];
    }

    /**
        @notice Whether a whitelisted ERC20 token contract address exists for the symbol.
     */
    function isCollateralWhitelisted(string memory symbol)
        public
        view
        returns (bool)
    {
        return _whitelist[symbol] != address(0);
    }

    function __CollateralWhitelist_init() internal initializer {}

    /**
        @notice Performs whitelisting of the ERC20 collateral token.
        @dev Whitelists the collateral token, expecting the symbol to not have been previously whitelisted.
             Will revert if address is zero or the symbol already has a mapped address, or does not implement get symbol.
     */
    function _whitelistCollateral(address erc20CollateralTokens_) internal {
        _requireNonZeroAddress(erc20CollateralTokens_);

        string memory symbol = IERC20MetadataUpgradeable(erc20CollateralTokens_)
            .symbol();
        require(_whitelist[symbol] == address(0), "Whitelist: already present");
        _whitelist[symbol] = erc20CollateralTokens_;
    }

    /**
        @notice Updates an already whitelisted address.
        @dev Updates a previously whitelisted address to the given.
             Will revert if the address is zero, is identical to the current address, or does not implement get symbol.
     */
    function _updateWhitelistedCollateral(address erc20CollateralTokens_)
        internal
    {
        _requireNonZeroAddress(erc20CollateralTokens_);

        string memory symbol = IERC20MetadataUpgradeable(erc20CollateralTokens_)
            .symbol();
        require(isCollateralWhitelisted(symbol), "Whitelist: not whitelisted");
        require(
            _whitelist[symbol] != erc20CollateralTokens_,
            "Whitelist: identical address"
        );
        _whitelist[symbol] = erc20CollateralTokens_;
    }

    /**
        @notice Deletes a collateral token from the whitelist.
        @dev Expects the symbol to be an existing entry, reverting otherwise.
     */
    function _removeWhitelistedCollateral(string memory symbol) internal {
        require(isCollateralWhitelisted(symbol), "Whitelist: not whitelisted");
        delete _whitelist[symbol];
    }

    /**
        @notice Ensures the address is not the zero address.
        @dev Reverts when the address is the zero address.
     */
    function _requireNonZeroAddress(address examine_) private pure {
        require(examine_ != address(0), "Whitelist: zero address");
    }
}
