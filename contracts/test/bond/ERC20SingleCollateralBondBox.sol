// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../bond/ERC20SingleCollateralBond.sol";

contract ERC20SingleCollateralBondBox is ERC20SingleCollateralBond {
    function initialize(
        Bond.MetaData memory metadata,
        Bond.Settings memory configuration,
        address treasury
    ) external initializer {
        __ERC20SingleCollateralBond_init(metadata, configuration, treasury);
    }

    function deposit(uint256 amount) external override {
        _deposit(amount);
    }
}
