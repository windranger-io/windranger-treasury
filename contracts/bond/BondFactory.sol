// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./Bond.sol";

/**
 * @title Creates configured bond contracts.
 *
 * @dev Applies common configuration to bond contracts created.
 */
contract BondFactory is Ownable {
    address private _treasury;

    mapping(string => address) private _collateralTokensWhitelist;

    event CreateBond(
        address bond,
        string name,
        string debtSymbol,
        uint256 debtAmount,
        address owner,
        address treasury,
        uint256 expiryTimestamp,
        string data
    );

    /**
     * @dev Creates the factory with the given collateral tokens automatically being whitelisted.
     */
    constructor(address erc20CollateralTokens_, address erc20CapableTreasury_) {
        require(
            erc20CollateralTokens_ != address(0),
            "BF: collateral is zero address"
        );
        require(
            erc20CapableTreasury_ != address(0),
            "BF: treasury is zero address"
        );

        _treasury = erc20CapableTreasury_;

        _collateralTokensWhitelist[
            IERC20Metadata(erc20CollateralTokens_).symbol()
        ] = erc20CollateralTokens_;
    }

    function createBond(
        string calldata name_,
        string calldata symbol_,
        uint256 debtTokens_,
        string calldata collateralTokenSymbol_,
        uint256 expiryTimestamp_,
        string calldata data_
    ) external returns (address) {
        require(
            isCollateralTokenWhitelisted(collateralTokenSymbol_),
            "BF: collateral not whitelisted"
        );

        Bond bond = new Bond();

        emit CreateBond(
            address(bond),
            name_,
            symbol_,
            debtTokens_,
            owner(),
            _treasury,
            expiryTimestamp_,
            data_
        );

        bond.initialize(
            name_,
            symbol_,
            debtTokens_,
            _collateralTokensWhitelist[collateralTokenSymbol_],
            _treasury,
            expiryTimestamp_,
            data_
        );
        bond.transferOwnership(owner());

        return address(bond);
    }

    /**
     * @dev Permits the owner to update the treasury address.
     * Only applies for bonds created after the update, previously created bonds remain unchanged.
     */
    function setTreasury(address treasury_) external onlyOwner {
        require(treasury_ != address(0), "BF: treasury is zero address");
        _treasury = treasury_;
    }

    /**
     * @dev Permits the owner to update the collateral token address of an already whitelisted token.
     * Only applies for bonds created after the update, previously created bonds remain unchanged.
     */
    function updateCollateralTokenAddress(address erc20CollateralTokens_)
        external
        onlyOwner
    {
        require(
            erc20CollateralTokens_ != address(0),
            "BF: collateral is zero address"
        );

        string memory symbol = IERC20Metadata(erc20CollateralTokens_).symbol();
        require(
            isCollateralTokenWhitelisted(symbol),
            "BF: collateral not whitelisted"
        );
        require(
            _collateralTokensWhitelist[symbol] != erc20CollateralTokens_,
            "BF: collateral identical address"
        );
        _collateralTokensWhitelist[symbol] = erc20CollateralTokens_;
    }

    /**
     * @notice When a bond is created, the tokens used as collateral must have been whitelisted.
     *
     * @dev Whitelists the erc20 symbol as a Bond collateral token from now onwards.
     *      On bond creation the tokens address used is retrieved by symbol from the whitelist.
     */
    function whitelistCollateralToken(address erc20CollateralTokens_)
        external
        onlyOwner
    {
        require(
            erc20CollateralTokens_ != address(0),
            "BF: whitelist is zero address"
        );

        string memory symbol = IERC20Metadata(erc20CollateralTokens_).symbol();
        require(
            _collateralTokensWhitelist[symbol] == address(0),
            "BF: whitelist already present"
        );
        _collateralTokensWhitelist[symbol] = erc20CollateralTokens_;
    }

    /**
     * @dev Retrieves the address for the collateral token address, if known (whitelisted).
     */
    function collateralTokenAddress(string calldata symbol)
        external
        view
        returns (address)
    {
        return _collateralTokensWhitelist[symbol];
    }

    /**
     * @dev Retrieves the address that receives any slashed or remaining funds.
     */
    function treasury() external view returns (address) {
        return _treasury;
    }

    /**
     * @dev Whether the token symbol has been whitelisted for use as collateral in a Bond.
     */
    function isCollateralTokenWhitelisted(string memory symbol)
        public
        view
        returns (bool)
    {
        return _collateralTokensWhitelist[symbol] != address(0);
    }
}
