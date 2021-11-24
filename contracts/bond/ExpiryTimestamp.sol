// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
    @title Expiry date, with assessment against the block timestamp.
    @dev Expiry date using block current timestamp, following the upgradable approach of using init over constructor.
          This module is used through inheritance.
          Provides the modifier `hasExpired` that can be applied to your functions to restrict use until the time
          is after  the expiry timestamp.
 */
abstract contract ExpiryTimestamp is Initializable {
    uint256 private _expiry;

    /**
        @notice Reverts when the time has not met or passed the expiry timestamp.
                Warning: use of block timestamp introduces risk of miner time manipulation.
     */
    modifier whenBeyondExpiry() {
        require(block.timestamp >= _expiry, "ExpiryTimestamp: not yet expired");
        _;
    }

    /**
        @notice Initialisation of the expiry timestamp to enable the 'hasExpired' modifier.
        @dev Sets the expiry timestamp as given, with no restriction on when e.g. it be in the past.
     */
    function __ExpiryTimestamp_init(uint256 expiryTimestamp_)
        internal
        initializer
    {
        _expiry = expiryTimestamp_;
    }
}
