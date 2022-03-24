// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../bond/ERC20SingleCollateralBond.sol";

contract ERC20SingleCollateralBondBox is ERC20SingleCollateralBond {
    function initialize(
        string calldata name,
        string calldata symbol,
        uint256 debtAmount,
        address erc20CollateralTokens,
        address erc20CapableTreasury,
        uint256 expiry,
        uint256 minimumDepositHolding,
        string calldata data
    ) external initializer {
        __ERC20SingleCollateralBond_init(
            name,
            symbol,
            debtAmount,
            erc20CollateralTokens,
            erc20CapableTreasury,
            expiry,
            minimumDepositHolding,
            data
        );
    }
}
