// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./ERC20SingleCollateralBond.sol";
import "./TimeLockMultiRewardBond.sol";
import "./Bond.sol";

contract SingleCollateralMultiRewardBond is
    ERC20SingleCollateralBond,
    TimeLockMultiRewardBond
{
    function deposit(uint256 amount) external override {
        address claimant = _msgSender();
        uint256 claimantDebt = balanceOf(claimant) + amount;
        _calculateRewardDebt(claimant, claimantDebt, totalSupply());
        _deposit(amount);
    }

    function initialize(
        Bond.MetaData memory metadata,
        Bond.Settings memory configuration,
        Bond.TimeLockRewardPool[] memory rewards,
        address erc20CapableTreasury
    ) external initializer {
        __ERC20SingleCollateralBond_init(
            metadata,
            configuration,
            erc20CapableTreasury
        );
        __TimeLockMultiRewardBond_init(rewards);
    }

    //TODO after transfer hook - update rewards
}
