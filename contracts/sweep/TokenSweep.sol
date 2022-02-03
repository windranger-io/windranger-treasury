// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Abstract upgradeable contract that provides the ability to sweep erroneous transferred tokens to a defined beneficiary address
 *
 * @dev Access control implementation is required for many functions by design
 */
abstract contract TokenSweep is UUPSUpgradeable {
    address internal _beneficiary;

    event BeneficiaryUpdated(address indexed beneficiary);

    function beneficiary() external view returns (address) {
        return _beneficiary;
    }

    /**
     * @notice Set the beneficiary of the token sweep
     *
     * @dev Needs access control implemented in the inheriting contract
     * @param beneficiary The address of the beneficiary
     */
    function _setBeneficiary(address newBeneficiary) internal {
        require(newBeneficiary != address(0), "TokenSweep: beneficiary-zero");
        require(newBeneficiary != address(this), "TokenSweep: self-address");
        require(newBeneficiary != _beneficiary, "TokenSweep: not-updating");

        _beneficiary = newBeneficiary;
        emit BeneficiaryUpdated(newBeneficiary);
    }
}
