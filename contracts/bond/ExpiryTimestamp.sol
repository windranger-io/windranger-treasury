// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
    @title Expiry date, with assessment against the block timestamp.
    @dev Expiry date using block current timestamp, following the upgradable approach of using init over constructor.
          This module is used through inheritance.
          It provides the modifier `hasExpired`, which can be applied to your functions to restrict their
          use until after the expiry date.
 */
abstract contract ExpiryTimestamp is Initializable {
    /**
        @notice Reverts when the time has not met or passed the expiry timestamp.
     */
    modifier hasExpired() {
        require(block.timestamp >= _expiry, "ExpiryTimestamp: not yet expired");
        _;
    }

    uint256 private _expiry;

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
