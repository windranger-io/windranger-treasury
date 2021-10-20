// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "./bond.sol";

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

        Bond bond = new Bond();

        emit BondCreated();

        //TODO mint the initial supply of debt tokens

        return bond;
    }
}
