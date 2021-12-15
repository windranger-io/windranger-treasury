// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title A string storage bucket for metadata.
 *
 * @notice A string for use by off-chain source to store on data not required for the contract operation on-chain.
 *
 * @dev Data is expected to include UI related pieces, perhaps delimited to support multiple items.
 */
abstract contract MetaDataStore is Initializable {
    string private _metaData;

    /**
     * @notice The storage box for meta information no required for the contract operation.
     *
     * @dev Information not pertinent to the contract, but relevant for off-chain evaluation
     *          e.g. performance factor, assessment date, rewards pool.
     */
    function metaData() external view returns (string memory) {
        return _metaData;
    }

    function __MetaDataStore_init(string calldata data)
        internal
        onlyInitializing
    {
        _metaData = data;
    }

    /**
     * @notice Replaces any existing stored metadata.
     *
     * @dev To expose the setter externally with modifier access control, create a new method invoking _setMetaData.
     */
    function _setMetaData(string calldata data) internal {
        _metaData = data;
    }
}
