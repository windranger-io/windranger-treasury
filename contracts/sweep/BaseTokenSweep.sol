// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title
 *
 * @dev
 */
abstract contract BaseTokenSweep is UUPSUpgradeable {
    address public beneficiary;

    event BeneficiaryUpdated(address indexed beneficiary);

    /**
     * @notice Set the beneficiary of the token sweep
     *
     * @dev Needs access control implemented in the inheriting contract
     * @param _beneficiary The address of the beneficiary
     */
    function setBeneficiary(address _beneficiary) external virtual {
        require(_beneficiary != address(0), "BaseTokenSweep: beneficiary-zero");
        require(_beneficiary != address(this), "BaseTokenSweep: self-address");
        require(_beneficiary != beneficiary, "BaseTokenSweep: not-updating");

        beneficiary = _beneficiary;
        emit BeneficiaryUpdated(_beneficiary);
    }
}
