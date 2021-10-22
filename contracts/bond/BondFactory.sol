// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Bond.sol";

/**
 * @title Creates configured bond contracts.
 *
 * @dev Applies common configuration to bond contract created.
 */
contract BondFactory is Context, Ownable {
    event BondCreated(
        address bond,
        string name,
        string symbol,
        address owner,
        address treasury
    );

    address private _securityToken;
    address private _treasury;

    constructor(address securityToken_, address treasury_) {
        _securityToken = securityToken_;
        _treasury = treasury_;
    }

    function createBond(
        uint256 debtCertificates,
        string calldata name,
        string calldata symbol
    ) external returns (address) {
        Bond bond = new Bond(name, symbol, _securityToken, _treasury);
        bond.mint(debtCertificates);
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
     * @dev Retrieves the address that receives any slashed funds.
     */
    function treasury() external view returns (address) {
        return _treasury;
    }

    /**
     * @dev Permits the owner to update the treasury address, recipient of any slashed funds.
     */
    function setTreasury(address treasury_) external onlyOwner {
        _treasury = treasury_;
    }

    /**
     * @dev Retrieves the address for the security token.
     */
    function securityToken() external view returns (address) {
        return _securityToken;
    }

    /**
     * @dev Permits the owner to update the security token address.
     */
    function setSecurityToken(address securityToken_) external onlyOwner {
        _securityToken = securityToken_;
    }
}
