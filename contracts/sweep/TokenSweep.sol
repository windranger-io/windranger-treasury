// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * @title Abstract upgradeable contract providing the ability to sweep tokens to a nominated beneficiary address.
 *
 * @dev Access control implementation is required for many functions by design.
 */
abstract contract TokenSweep is ContextUpgradeable {
    address private _beneficiary;

    event BeneficiaryUpdate(
        address indexed beneficiary,
        address indexed instigator
    );

    function tokenSweepBeneficiary() public view returns (address) {
        return _beneficiary;
    }

    //slither-disable-next-line naming-convention
    function __TokenSweep_init(address beneficiary) internal onlyInitializing {
        __Context_init();
        _setTokenSweepBeneficiary(beneficiary);
    }

    /**
     * @notice Sets the beneficiary of the token sweep.
     *
     * @dev Needs access control implemented in the inheriting contract.
     *
     * @param newBeneficiary The address to replace as the nominated beneficiary of any sweeping.
     */
    function _setTokenSweepBeneficiary(address newBeneficiary) internal {
        require(newBeneficiary != address(0), "TokenSweep: beneficiary zero");
        require(newBeneficiary != address(this), "TokenSweep: self address");
        require(newBeneficiary != _beneficiary, "TokenSweep: beneficiary same");

        _beneficiary = newBeneficiary;
        emit BeneficiaryUpdate(newBeneficiary, _msgSender());
    }
}
