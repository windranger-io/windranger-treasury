// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./TokenSweep.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @title Adds the ability to sweep a token to a beneficiary address
 *
 * @dev
 */
abstract contract SweepERC721 is TokenSweep {
    /**
     * @notice Sweep the erc721 tokens to the beneficiary address
     *
     * @dev Needs access control implemented in the inheriting contract
     **/
    function sweepERC721Tokens(address token, uint256 tokenId)
        external
        virtual
    {
        require(address(token) != address(this), "SweepERC721: self-transfer");
        require(address(token) != address(0), "SweepERC721: null-token");

        IERC721Upgradeable(token).safeTransferFrom(
            address(this),
            _beneficiary,
            tokenId
        );
    }
}
