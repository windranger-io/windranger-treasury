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

    address private _treasury;

    constructor(address treasury) {
        _treasury = treasury;
    }

    function createBond(
        uint256 debtCertificates,
        string calldata name,
        string calldata symbol
    ) external returns (address) {
        Bond bond = new Bond(name, symbol, owner(), _treasury);
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
    function treasury(address treasury) external onlyOwner {
        _treasury = treasury;
    }
}
