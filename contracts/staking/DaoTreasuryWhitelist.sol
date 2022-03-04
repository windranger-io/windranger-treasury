// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

import "./Roles.sol";
import "./StakingAccessControl.sol";

contract DaoTreasuryWhitelist is Initializable, StakingAccessControl {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    // Treasury addresses
    EnumerableSetUpgradeable.AddressSet public treasuries;

    function whitelistTreasury(address treasury)
        external
        onlyRole(Roles.SUPER_USER)
    {
        require(treasuries.add(treasury), "cannot add whitelist");
    }

    function removeTreasury(address treasury)
        external
        onlyRole(Roles.SUPER_USER)
    {
        require(treasuries.remove(treasury), "cannot remove whitelist");
    }

    function isWhitelistedTreasury(address treasury)
        external
        view
        returns (bool)
    {
        return _isWhitelistedTreasury(treasury);
    }

    function _isWhitelistedTreasury(address treasury)
        internal
        view
        returns (bool)
    {
        return treasuries.contains(treasury);
    }
}
