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
    event BondCreated(address bond, string name, string symbol, address owner);

    //TODO do we need a reference to each created bond in the factory?

    function createBond(
        uint256 debtCertificates,
        string calldata name,
        string calldata symbol
    ) external returns (address) {
        Bond bond = new Bond(name, symbol, owner());
        bond.mint(debtCertificates);
        bond.transferOwnership(owner());
        emit BondCreated(address(bond), name, symbol, owner());

        return address(bond);
    }
}
