// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @title Configuration settings for creating a new Bond.
 */
struct BondSettings {
    /** Number of tokens to create, which get swapped for collateral tokens by depositing. */
    uint256 debtTokens;
    /** Abbreviation of the collateral token that are swapped for debt tokens in deposit. */
    string collateralTokenSymbol;
    /**
     * Unix timestamp for when the Bond is expired and anyone can move the remaining collateral to the Treasury,
     * then petitions may be made for redemption.
     */
    uint256 expiryTimestamp;
    /**
     * Minimum debt holding allowed in the deposit phase. Once the minimum is met,
     * any sized deposit from that account is allowed, as the minimum has already been met.
     */
    uint256 minimumDeposit;
    /** receiver of any slashed or swept tokens. */
    address treasury;
    /** Metadata not required for the operation of the Bond, but needed by external actors. */
    string data;
}
