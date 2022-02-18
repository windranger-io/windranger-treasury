// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @title Deploys new Bonds.
 *
 * @notice Creating a Bond involves the two steps of deploying and initialising.
 */
interface BondCreator {
    struct BondIdentity {
        /** Description of the purpose of the Bond. */
        string name;
        /** Abbreviation to identify the Bond. */
        string symbol;
    }

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

    event CreateBond(
        address indexed bond,
        string name,
        string debtSymbol,
        uint256 debtAmount,
        address indexed creator,
        address treasury,
        uint256 expiryTimestamp,
        uint256 minimumDeposit,
        string data
    );

    /**
     * @notice Deploys and initialises a new Bond.
     *
     * @param id Identity for the Bond to create.
     * @param config Values to use during the Bond creation process.
     */
    function createBond(BondIdentity calldata id, BondSettings calldata config)
        external
        returns (address);
}
