// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * @title Encapsulates the state of being redeemable.
 *
 * @notice The state of being redeemable is boolean and single direction transition from false to true.
 */
abstract contract Redeemable is ContextUpgradeable {
    bool private _redeemable;

    string private _reason;

    event Redeemable(address indexed instigator);

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

    function redemptionReason() external view returns (string memory) {
        return _reason;
    }

    function redeemable() public view returns (bool) {
        return _redeemable;
    }

    //slither-disable-next-line naming-convention
    function __Redeemable_init() internal onlyInitializing {}

    /**
     * @dev Transitions redeemable from `false` to `true`.
     *
     * No affect if state is already transitioned.
     */
    function _setAsRedeemable(string calldata reason) internal {
        _redeemable = true;
        _reason = reason;
        emit Redeemable(_msgSender());
    }
}
