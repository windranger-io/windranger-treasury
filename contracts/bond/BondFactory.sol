// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CollateralWhitelist.sol";
import "./Bond.sol";

/**
 * @title Creates configured bond contracts.
 *
 * @dev Applies common configuration to bond contracts created.
 */
contract BondFactory is CollateralWhitelist, Ownable {
    address private _treasury;

    event CreateBond(
        address bond,
        string name,
        string debtSymbol,
        uint256 debtAmount,
        address owner,
        address treasury,
        uint256 expiryTimestamp,
        string data
    );

    /**
     * @dev Creates the factory with the given collateral tokens automatically being whitelisted.
     */
    constructor(address erc20CollateralTokens_, address erc20CapableTreasury_) {
        require(
            erc20CapableTreasury_ != address(0),
            "BF: treasury is zero address"
        );

        _treasury = erc20CapableTreasury_;

        _whitelistCollateralToken(erc20CollateralTokens_);
    }

    function createBond(
        string calldata name_,
        string calldata symbol_,
        uint256 debtTokens_,
        string calldata collateralTokenSymbol_,
        uint256 expiryTimestamp_,
        string calldata data_
    ) external returns (address) {
        require(
            isCollateralTokenWhitelisted(collateralTokenSymbol_),
            "BF: collateral not whitelisted"
        );

        Bond bond = new Bond();

        emit CreateBond(
            address(bond),
            name_,
            symbol_,
            debtTokens_,
            owner(),
            _treasury,
            expiryTimestamp_,
            data_
        );

        bond.initialize(
            name_,
            symbol_,
            debtTokens_,
            collateralTokenAddress(collateralTokenSymbol_),
            _treasury,
            expiryTimestamp_,
            data_
        );
        bond.transferOwnership(owner());

        return address(bond);
    }

    /**
     * @dev Permits the owner to update the treasury address.
     * Only applies for bonds created after the update, previously created bonds remain unchanged.
     */
    function setTreasury(address treasury_) external onlyOwner {
        require(treasury_ != address(0), "BF: treasury is zero address");
        _treasury = treasury_;
    }

    /**
     * @dev Permits the owner to update the collateral token address of an already whitelisted token.
     * Only applies for bonds created after the update, previously created bonds remain unchanged.
     */
    function updateCollateralTokenAddress(address erc20CollateralTokens_)
        external
        onlyOwner
    {
        _updateCollateralToken(erc20CollateralTokens_);
    }

    /**
     * @notice When a bond is created, the tokens used as collateral must have been whitelisted.
     *
     * @dev Whitelists the erc20 symbol as a Bond collateral token from now onwards.
     *      On bond creation the tokens address used is retrieved by symbol from the whitelist.
     */
    function whitelistCollateralToken(address erc20CollateralTokens_)
        external
        onlyOwner
    {
        _whitelistCollateralToken(erc20CollateralTokens_);
    }

    /**
     * @dev Retrieves the address that receives any slashed or remaining funds.
     */
    function treasury() external view returns (address) {
        return _treasury;
    }
}
