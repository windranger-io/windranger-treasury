// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../../bond/CollateralWhitelist.sol";

/**
 * Contract matching the data layout of the BondFactory, but with an self destruct used in a new function.
 */
contract BondFactoryWithSelfDestruct is
    CollateralWhitelist,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    address private _treasury;

    function doomed() external payable onlyOwner {
        selfdestruct(payable(owner()));
    }

    function setTreasury(address treasury_) external onlyOwner {
        require(treasury_ != address(0), "treasury is zero address");
        require(_treasury != treasury_, "treasury address identical");
        _treasury = treasury_;
    }

    function treasury() external view returns (address) {
        return _treasury;
    }

    /**
     * Permits only the owner to perform upgrades.
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
