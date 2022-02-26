// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title Encapsulates the state of being redeemable.
 *
 * @notice The state of being redeemable is boolean and single direction transition from false to true.
 */
abstract contract Redeemable is Initializable {
    bool private _redeemable;

    /**
     * @notice Makes a function callable only when the contract is not redeemable.
     *
     * @dev Reverts when the contract is redeemable.
     *
     * Requirements:
     * - The contract must not be redeemable.
     */
    modifier whenNotRedeemable() {
        require(!_redeemable, "whenNotRedeemable: redeemable");
        _;
    }

    /**
     * @notice Makes a function callable only when the contract is redeemable.
     *
     * @dev Reverts when the contract is not yet redeemable.
     *
     * Requirements:
     * - The contract must be redeemable.
     */
    modifier whenRedeemable() {
        require(_redeemable, "whenRedeemable: not redeemable");
        _;
    }

    function redeemable() external view returns (bool) {
        return _redeemable;
    }

    //slither-disable-next-line naming-convention
    function __Redeemable_init() internal onlyInitializing {}

    /**
     * @dev Transitions redeemable from `false` to `true`.
     *
     * No affect if state is already transitioned.
     */
    function _allowRedemption() internal {
        _redeemable = true;
    }
}
