// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../performance-bonds/ERC20SingleCollateralPerformanceBond.sol";

contract ERC20SingleCollateralBondBox is ERC20SingleCollateralPerformanceBond {
    function allowRedemption(string calldata reason) external override {
        _allowRedemption(reason);
    }

    function deposit(uint256 amount) external override {
        _deposit(amount);
    }

    function initialize(
        PerformanceBond.MetaData calldata metadata,
        PerformanceBond.Settings calldata configuration,
        address treasury
    ) external initializer {
        __ERC20SingleCollateralBond_init(metadata, configuration, treasury);
    }

    function updateRewardTimeLock(address tokens, uint128 timeLock)
        external
        override
    {}
}
