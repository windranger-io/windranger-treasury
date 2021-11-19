// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
    @title Abstraction for whether a contract has the state of being redeemable.
    @dev A state machine of two states, not redeemable and redeemable.
         Provides the modifiers `onlyWhenRedeemable` and `onlyWhenNotRedeemable` that can be applied to your functions
         to restrict use until the appropriate state is attained.
         This module is used through inheritance.
 */
abstract contract Redeemable is Initializable {

    /// Whether the state is redeemable (or not redeemable)
    bool private _redeemable;

    /**
     * @dev Modifier to make a function callable only when the contract is not redeemable.
     *
     * Requirements:
     * - The contract must not be redeemable.
     */
    modifier whenNotRedeemable() {
        require(!_redeemable, "whenNotRedeemable: redeemable");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is redeemable.
     *
     * Requirements:
     * - The contract must be redeemable.
     */
    modifier whenRedeemable() {
        require(_redeemable, "whenRedeemable: not redeemable");
        _;
    }

    /**
     * @dev whether the Bond is in the redemption state (allows redeem operation, but denies deposit, mint and slash).
     */
    function redeemable() external view returns (bool) {
        return _redeemable;
    }

    function __Redeemable_init() internal initializer {}

    /**
        @notice Sets the state to that of redemption.
        @dev Any future invocation of modifiers will have them
     */
    function _allowRedemption() internal {
        _redeemable = true;
    }
}
