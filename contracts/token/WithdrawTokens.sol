// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @title Making a token withdrawable by the owner to a specified onlyOwner setable address
 *
 * @dev
 */
abstract contract WithdrawTokens is OwnableUpgradeable {
    address public beneficiary;

    event BeneficiaryUpdated(address beneficiary);

    constructor(address _owner) {
        transferOwnership(_owner);
    }

    function setBeneficiary(address _beneficiary) public onlyOwner {
        require(_beneficiary != address(0), "WithdrawTokens/beneficiary zero");
        beneficiary = _beneficiary;
        emit BeneficiaryUpdated(_beneficiary);
    }

    function withdrawERC20Tokens(IERC20Upgradeable token, uint256 amount)
        public
        onlyOwner
    {
        // can we safely make this non-onlyOwner?
        // approvals?

        token.transfer(beneficiary, amount); // use safe transfer lib?
    }

    function withdrawERC721Tokens(IERC721Upgradeable token, uint256 tokenId)
        public
        onlyOwner
    {
        // can we safely make this non-onlyOwner?
        token.safeTransferFrom(address(this), beneficiary, tokenId);
    }
}
