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
        address owner,
        address treasury
    );

    address private _collateralToken;
    address private _treasury;

    constructor(address securityToken_, address treasury_) {
        _collateralToken = securityToken_;
        _treasury = treasury_;
    }

    function createBond(
        uint256 debtTokens,
        string calldata name,
        string calldata symbol
    ) external returns (address) {
        Bond bond = new Bond(name, symbol, _collateralToken, _treasury);
        bond.mint(debtTokens);
        bond.transferOwnership(owner());
        emit BondCreated(
            address(bond),
            name,
            symbol,
            bond.owner(),
            bond.treasury()
        );

        return address(bond);
    }

    /**
     * @dev Retrieves the address that receives any slashed or remaining funds.
     */
    function treasury() external view returns (address) {
        return _treasury;
    }

    /**
     * @dev Permits the owner to update the treasury address.
     * Only applies for bonds created after the update, previously created bonds remain unchanged.
     */
    function setTreasury(address treasury_) external onlyOwner {
        _treasury = treasury_;
    }

    /**
     * @dev Retrieves the address for the collateral token.
     */
    function collateralToken() external view returns (address) {
        return _collateralToken;
    }

    /**
     * @dev Permits the owner to update the collateral token address.
     * Only applies for bonds created after the update, previously created bonds remain unchanged.
     */
    function setCollateralToken(address collateralToken_) external onlyOwner {
        _collateralToken = collateralToken_;
    }
}
