// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../performance-bonds/TimeLockMultiRewardPerformanceBond.sol";

contract TimeLockMultiRewardBondBox is TimeLockMultiRewardPerformanceBond {
    uint256 private constant _TOTAL_SUPPLY = 10000;

    function claimantDebt(uint256 amount) external {
        address claimant = _msgSender();
        _calculateRewardDebt(claimant, amount, totalSupply());
    }

    function initialize(PerformanceBond.TimeLockRewardPool[] calldata rewards)
        external
        initializer
    {
        __TimeLockMultiRewardBond_init(rewards);
    }

    function setRedemptionTimestamp() external {
        _setRedemptionTimestamp(uint128(block.timestamp));
    }

    function totalSupply() public pure returns (uint256) {
        return _TOTAL_SUPPLY;
    }
}
