// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title A string storage bucket for metadata.
 *
 * @notice Useful for off-chain actors to store on data, related to the contract but not required for the contract
 *          on-chain operations.
 *
 * @dev Metadata could include UI related pieces, perhaps in a delimited format to support multiple items.
 */
abstract contract MetaDataStore is Initializable {
    string private _metaData;

    /**
     * @notice The storage box for metadata. Information not required by the contract for operations.
     *
     * @dev Information related to the contract but not needed by the contract.
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
