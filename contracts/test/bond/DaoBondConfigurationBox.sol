// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../bond/DaoBondConfiguration.sol";

/**
 * @title Box to test the access control dedicated for the Bond family of contracts.
 *
 * @notice An empty box for testing the provided modifiers and management for access control required throughout the Bond contracts.
 */
contract DaoBondConfigurationBox is DaoBondConfiguration {
    /**
     * As BondAccessControl is intended to be used in Upgradable contracts, it uses an init.
     */
    constructor() initializer {
        __DaoBondConfiguration_init();
    }

    function daoBondConfiguration(address erc20CapableTreasury)
        external
        returns (uint256)
    {
        return _daoBondConfiguration(erc20CapableTreasury);
    }

    function setDaoTreasury(uint256 daoId, address replacementTreasury)
        external
    {
        _setDaoTreasury(daoId, replacementTreasury);
    }

    function setDaoMetaData(uint256 daoId, string calldata replacementMetaData)
        external
    {
        _setDaoMetaData(daoId, replacementMetaData);
    }

    function whitelistDaoCollateral(
        uint256 daoId,
        address erc20CollateralTokens
    ) external {
        _whitelistDaoCollateral(daoId, erc20CollateralTokens);
    }

    function removeWhitelistedDaoCollateral(uint256 daoId, address tokens)
        external
    {
        _removeWhitelistedDaoCollateral(daoId, tokens);
    }
}
