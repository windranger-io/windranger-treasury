// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title Provides an expiry timestamp, with evaluation modifier.
 *
 * @dev Time evaluation uses the block current timestamp.
 */
abstract contract ExpiryTimestamp is Initializable {
    uint256 private _expiry;

    /**
     * @notice Reverts when the time has not met or passed the expiry timestamp.
     *
     * @dev Warning: use of block timestamp introduces risk of miner time manipulation.
     */
    modifier whenBeyondExpiry() {
        require(block.timestamp >= _expiry, "ExpiryTimestamp: not yet expired");
        _;
    }

    /**
     * @notice Initialisation of the expiry timestamp to enable the 'hasExpired' modifier.
     *
     * @param expiryTimestamp expiry without any restriction e.g. it has not yet passed.
     */
    function __ExpiryTimestamp_init(uint256 expiryTimestamp)
        internal
        initializer
    {
        _expiry = expiryTimestamp;
    }
}
