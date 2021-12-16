// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

//TODO comment
abstract contract BondCreator {
    function createBond(
        string calldata name,
        string calldata symbol,
        uint256 debtTokens,
        string calldata collateralTokenSymbol,
        uint256 expiryTimestamp,
        uint256 minimumDeposit,
        string calldata data
    ) external virtual returns (address);
}
