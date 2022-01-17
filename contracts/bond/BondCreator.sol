// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @title Deploys new Bonds.
 *
 * @notice Creating a Bond involves the two steps of deploying and initialising.
 */
abstract contract BondCreator {
    event CreateBond(
        address bond,
        string name,
        string debtSymbol,
        uint256 debtAmount,
        address creator,
        address treasury,
        uint256 expiryTimestamp,
        uint256 minimumDeposit,
        string data
    );

    /**
     * @notice Deploys and initialises a new Bond.
     *
     * @param name Description of the purpose of the Bond.
     * @param symbol Abbreviation to identify the Bond.
     * @param debtTokens Number of tokens to create, which get swapped for collateral tokens by depositing.
     * @param collateralTokenSymbol Abbreviation of the collateral token that are swapped for debt tokens in deposit.
     * @param expiryTimestamp Unix timestamp for when the Bond is expired and anyone can move the remaining collateral
     *              to the Treasury, then petition for redemption.
     * @param minimumDeposit Minimum debt holding allowed in the deposit phase. Once the minimum is met,
     *              any sized deposit from that account is allowed, as the minimum has already been met.
     * @param data Metadata not required for the operation of the Bond, but needed by external actors.
     */
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
