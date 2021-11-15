// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Bond.sol";

/**
 * @title Creates configured bond contracts.
 *
 * @dev Applies common configuration to bond contracts created.
 */
contract BondFactory is Context, Ownable {
    event BondCreated(
        address bond,
        string name,
        string symbol,
        uint256 amount,
        address owner,
        address treasury
    );

    address private _collateralTokens;
    address private _treasury;

    constructor(address erc20CollateralTokens_, address erc20CapableTreasury_) {
        require(
            erc20CollateralTokens_ != address(0),
            "BondFactory::constructor: collateral tokens is zero address"
        );
        require(
            erc20CapableTreasury_ != address(0),
            "BondFactory::constructor: treasury is zero address"
        );
        _collateralTokens = erc20CollateralTokens_;
        _treasury = erc20CapableTreasury_;
    }

    function createBond(
        string calldata name,
        string calldata symbol,
        uint256 debtTokens
    ) external returns (address) {
        Bond bond = new Bond();

        emit BondCreated(
            address(bond),
            name,
            symbol,
            debtTokens,
            owner(),
            _treasury
        );
        bond.initialize(name, symbol, debtTokens, _collateralTokens, _treasury);
        bond.transferOwnership(owner());

        return address(bond);
    }

    /**
     * @dev Retrieves the address for the collateral token.
     */
    function collateralTokens() external view returns (address) {
        return _collateralTokens;
    }

    /**
     * @dev Retrieves the address that receives any slashed or remaining funds.
     */
    function treasury() external view returns (address) {
        return _treasury;
    }

    /**
     * @dev Permits the owner to update the collateral token address.
     * Only applies for bonds created after the update, previously created bonds remain unchanged.
     */
    function setCollateralTokens(address erc20CollateralTokens_)
        external
        onlyOwner
    {
        require(
            erc20CollateralTokens_ != address(0),
            "BondFactory::setCollateralTokens: collateral tokens is zero address"
        );
        _collateralTokens = erc20CollateralTokens_;
    }

    /**
     * @dev Permits the owner to update the treasury address.
     * Only applies for bonds created after the update, previously created bonds remain unchanged.
     */
    function setTreasury(address treasury_) external onlyOwner {
        require(
            treasury_ != address(0),
            "BondFactory::setTreasury: treasury is zero address"
        );
        _treasury = treasury_;
    }
}
