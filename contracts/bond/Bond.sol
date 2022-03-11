// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @title Domain model for Bonds.
 */
library Bond {
    struct MetaData {
        /** Description of the purpose of the Bond. */
        string name;
        /** Abbreviation to identify the Bond. */
        string symbol;
        /** Metadata bucket not required for the operation of the Bond, but needed by external actors. */
        string data;
    }

    struct Settings {
        /** Number of tokens to create, which get swapped for collateral tokens by depositing. */
        uint256 debtTokenAmount;
        /** Token contract for the collateral that is swapped for debt tokens during deposit. */
        address collateralTokens;
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
    }
}
