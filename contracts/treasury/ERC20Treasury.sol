// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/Treasury.sol";

/**
 * @title Treasury for a single ERC20 token type.
 *
 * @dev
 */
interface ERC20Treasury is Treasury, Ownable {

    function deposit(uint256 amount) public onlyOwner {

        //TODO either approve & transferFrom or Orcale sends in notifications on transfer events

        //TODO emit transfer in event
    }


    /*
function stake(address _token, uint256 amount)
        external
    {
        require(amount > 0, "Cannot stake 0");
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        // Before this you should have approved the amount
        // This will transfer the amount of  _token from caller to contract
        IERC20(_token).transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }
    */


    function withdraw(address destination, uint256 amount) public onlyOwner {
        //TODO check balance, maybe do that elsewhere?
        //TODO contract the ERC20 contract and transfer
        //TODO emit transfer out event
    }
}
