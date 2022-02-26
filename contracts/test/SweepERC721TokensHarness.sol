// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../sweep/SweepERC721.sol";
import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

contract SweepERC721TokensHarness is SweepERC721 {
    function setBeneficiary(address beneficiary) external {
        _setTokenSweepBeneficiary(beneficiary);
    }

    function sweepERC721Tokens(address token, uint256 tokenId) external {
        _sweepERC721Tokens(token, tokenId);
    }
}
