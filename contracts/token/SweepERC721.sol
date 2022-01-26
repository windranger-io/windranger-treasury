// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./BaseTokenSweep.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @title Adds the ability to sweep a token to a beneficiary address
 *
 * @dev
 */
abstract contract SweepERC721 is BaseTokenSweep {
    function sweepERC721Tokens(IERC721Upgradeable token, uint256 tokenId)
        external
        virtual
    {
        require(address(token) != address(this), "SweepERC721/self-transfer");
        require(address(token) != address(0), "SweepERC721/null-token");

        token.safeTransferFrom(address(this), beneficiary, tokenId);
    }
}
