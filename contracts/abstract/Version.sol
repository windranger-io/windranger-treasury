// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

abstract contract Version {
    function getVersion() public view virtual returns (string memory);
}
