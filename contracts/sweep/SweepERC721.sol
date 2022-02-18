// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TokenSweep.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @title Adds the ability to sweep ERC721 tokens to a beneficiary address
 */
abstract contract SweepERC721 is TokenSweep {
    /**
     * @notice Sweep the erc721 tokens to the beneficiary address
     **/
    function _sweepERC721Tokens(address token, uint256 tokenId) internal {
        require(token != address(this), "SweepERC721: self-transfer");
        require(token != address(0), "SweepERC721: null-token");

        IERC721Upgradeable(token).safeTransferFrom(
            address(this),
            _beneficiary,
            tokenId
        );
    }
}
