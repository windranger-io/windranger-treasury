// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "./Bond.sol";

/**
 * @title Creates configured bond contracts.
 *
 * @dev Applies common configuration to bond contract created.
 */
contract BondFactory is Context {
    event BondCreated();

    //TODO do we need a reference to each created bond in the factory?

    constructor() {}

    function createBond() external returns (address) {
        address from = _msgSender();

        //TODO init/create with config

        //TODO generate these / pull from config
        string memory name = "Bond Debt Certificate";
        string memory symbol = "BDC0001";
        address token = address(0);

        Bond bond = new Bond(name, symbol, token);

        emit BondCreated();

        //TODO mint the initial supply of debt tokens

        //TODO transfer ownership to bitdaoadmin

        return address(bond);
    }
}
