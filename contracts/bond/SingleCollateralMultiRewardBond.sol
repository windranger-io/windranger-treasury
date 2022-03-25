// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./ERC20SingleCollateralBond.sol";
import "./TimeLockMultiRewardBond.sol";
import "./Bond.sol";

contract SingleCollateralMultiRewardBond is
    ERC20SingleCollateralBond,
    TimeLockMultiRewardBond
{
    function initialize(
        Bond.MetaData memory metadata,
        Bond.Settings memory configuration,
        Bond.TimeLockRewardPool[] memory rewards,
        address treasury
    ) external initializer {
        __ERC20SingleCollateralBond_init(metadata, configuration, treasury);
        __TimeLockMultiRewardBond_init(rewards);
    }

    function _isDetTokenHolder(address claimant)
        internal
        view
        override
        returns (bool)
    {
        return balanceOf(claimant) > 0;
    }

    //TODO init for rewards
    //TODO after transfer hook - update rewards
}
