// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../interfaces/ERC721DepositStrategy.sol";
import "../interfaces/ERC721WithdrawStrategy.sol";

/**
 * @title Vault for ERC-721 token types.
 *
 * @dev
 */
contract ERC721Vault is Context, IERC721Receiver {
    ERC721DepositStrategy private _depositStrategy;
    ERC721WithdrawStrategy private _withdrawStrategy;

    constructor(ERC721DepositStrategy deposit, ERC721WithdrawStrategy withdraw)
    {
        _depositStrategy = deposit;
        _withdrawStrategy = withdraw;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        //TODO require on input parameters to reject certain (non-whitelisted tokens)

        //TODO invoke despositERC721()

        return IERC721Receiver.onERC721Received.selector;
    }

    function doSomethingWith721Token(IERC721 nftAddress, uint256 tokenId)
        external
    {
        // do something here
    }

    function depositERC721(uint256 amount) public {
        //TODO either approve & transferFrom or Orcale sends in notifications on transfer events
        //TODO emit transfer in event
    }

    function withdrawERC721(address destination, uint256 amount) public {
        //TODO check balance, maybe do that elsewhere?
        //TODO contract the ERC20 contract and transfer
        //TODO emit transfer out event
    }
}
