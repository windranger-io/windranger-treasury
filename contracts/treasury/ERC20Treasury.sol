// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "../interfaces/ERC20DepositStrategy.sol";
import "../interfaces/ERC20WithdrawStrategy.sol";

import "../abstract/Version.sol";

/**
 * @title Vault for ERC20 token types.
 *
 * @dev
 */
contract ERC20Treasury is Version, Context {
    ERC20DepositStrategy private _depositStrategy;
    ERC20WithdrawStrategy private _withdrawStrategy;
    mapping(string => address) private _tokens;

    constructor(ERC20DepositStrategy deposit, ERC20WithdrawStrategy withdraw) {
        _depositStrategy = deposit;
        _withdrawStrategy = withdraw;
    }

    function addERC20(address token) public {
        //TODO require token address to be an ERC20 token
        //TODO emit event
        //TODO get the abbreviation from the token & put into _tokens
    }

    function depositERC20(uint256 amount, string calldata tokenAbbreviation)
        public
    {
        //TODO require the token to be one that is being stored
        //TODO either approve & transferFrom or Orcale sends in notifications on transfer events
        //TODO emit transfer in event
        // Before this you should have approved the amount
        // This will transfer the amount of  _token from caller to contract
        //   IERC20(_token).transferFrom(msg.sender, address(this), amount);
    }

    function withdrawERC20(
        address destination,
        string calldata tokenAbbreviation,
        uint256 amount
    ) public {
        //TODO check balance, maybe do that elsewhere or delegate to token contract?
        //TODO contact the ERC20 contract and transfer
        //TODO emit transfer out event
    }

    /// @notice Returns the API version
    function getVersion() public pure override returns (string memory) {
        return "v0.0.1";
    }
}
