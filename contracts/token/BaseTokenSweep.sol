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
        require(_beneficiary != address(0), "WithdrawTokens/beneficiary-zero");
        require(_beneficiary != address(this), "WithdrawToken/self-address");

        beneficiary = _beneficiary;
        emit BeneficiaryUpdated(_beneficiary);
    }

    /**
     * @notice An initializer instead of a constructor.
     *
     * @dev Compared to a constructor, an init adds deployment cost (as constructor code is executed but not deployed).
     *      However when used in conjunction with a proxy, the init means the contract can be upgraded.
     */
    function initialize() external virtual;
}
