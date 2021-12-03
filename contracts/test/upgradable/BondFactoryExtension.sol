// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../bond/BondFactory.sol";

/**
 * Contract adding a variable create a unique contract, that a BondFactory may be upgraded as.
 */
contract BondFactoryExtension is BondFactory {
    uint256 private _difference;

    function initialize(
        address erc20CollateralTokens_,
        address erc20CapableTreasury_
    ) external override initializer {
        __BondFactory_init(erc20CollateralTokens_, erc20CapableTreasury_);

        _difference = 7;
    }
}
