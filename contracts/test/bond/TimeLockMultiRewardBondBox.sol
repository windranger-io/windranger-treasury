// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../bond/TimeLockMultiRewardBond.sol";

contract TimeLockMultiRewardBondBox is TimeLockMultiRewardBond {
    uint256 private constant _TOTAL_SUPPLY = 10000;

    function claimantDebt(uint256 amount) external {
        address claimant = _msgSender();
        _calculateRewardDebt(claimant, amount, totalSupply());
    }

    function initialize(Bond.TimeLockRewardPool[] memory rewards)
        external
        initializer
    {
        __TimeLockMultiRewardBond_init(rewards);
    }

    function setRedemptionTimestamp() external {
        _setRedemptionTimestamp(uint128(block.timestamp));
    }

    function totalSupply() public view returns (uint256) {
        return _TOTAL_SUPPLY;
    }
}
