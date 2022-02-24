// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface DaoConfigurationAccess {
    /**
     * @notice Provides access to the internal storage for the whitelist of collateral tokens for a single DAO.
     *
     * @dev Although a view modifier, the underlying storage may be altered, as in this case the view restriction
     *         applies to the reference rather than the addresses.
     */
    function _daoCollateralWhitelist(uint256 daoId)
        internal
        view
        returns (mapping(string => address) storage);

    /**
     * @notice Whether a given DAO is currently associated with a live DAO.
     *
     * @dev At any moment, expect a range of IDs that have been assigned, with the possibility some DAOs within being
     *          deleted.
     */
    function _isValidDaoId(uint256 daoId) internal view returns (bool);
}
