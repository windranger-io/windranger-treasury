// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

//TODO comment
/**
    @title Whitelist of collateral tokens.
    @dev


          This module is used through inheritance.
 */
abstract contract CollateralWhitelist is Initializable {
    mapping(string => address) private _collateralTokensWhitelist;

    /**
     * @dev Retrieves the address for the collateral token address, if known (whitelisted).
     */
    function collateralTokenAddress(string calldata symbol)
        public
        view
        returns (address)
    {
        return _collateralTokensWhitelist[symbol];
    }

    /**
     * @dev Whether the token symbol has been whitelisted for use as collateral in a Bond.
     */
    function isCollateralTokenWhitelisted(string memory symbol)
        public
        view
        returns (bool)
    {
        return _collateralTokensWhitelist[symbol] != address(0);
    }

    function _whitelistCollateralToken(address erc20CollateralTokens_)
        internal
    {
        _requireNonZeroAddress(erc20CollateralTokens_);

        string memory symbol = IERC20MetadataUpgradeable(erc20CollateralTokens_)
            .symbol();
        require(
            _collateralTokensWhitelist[symbol] == address(0),
            "Whitelist: already present"
        );
        _collateralTokensWhitelist[symbol] = erc20CollateralTokens_;
    }

    function _updateCollateralToken(address erc20CollateralTokens_) internal {
        _requireNonZeroAddress(erc20CollateralTokens_);

        string memory symbol = IERC20MetadataUpgradeable(erc20CollateralTokens_)
            .symbol();
        require(
            isCollateralTokenWhitelisted(symbol),
            "Whitelist: not whitelisted"
        );
        require(
            _collateralTokensWhitelist[symbol] != erc20CollateralTokens_,
            "Whitelist: identical address"
        );
        _collateralTokensWhitelist[symbol] = erc20CollateralTokens_;
    }

    function _requireNonZeroAddress(address erc20CollateralTokens_) private {
        require(
            erc20CollateralTokens_ != address(0),
            "Whitelist: zero address"
        );
    }
}
