// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./Bond.sol";

/**
 * @title Creates configured bond contracts.
 *
 * @dev Applies common configuration to bond contracts created.
 */
contract BondFactory is Context, Ownable {
    event BondCreated(
        address bond,
        string name,
        string debtSymbol,
        uint256 debtAmount,
        string collateralSymbol,
        address owner,
        address treasury,
        string data
    );

    address private _treasury;

    mapping(string => address) private _collateralTokensWhitelist;

    /**
     * @dev Creates the factory with the given collateral tokens automatically being whitelisted.
     */
    constructor(address erc20CollateralTokens_, address erc20CapableTreasury_) {
        require(
            erc20CollateralTokens_ != address(0),
            "BondFactory::constructor: collateral tokens is zero address"
        );
        require(
            erc20CapableTreasury_ != address(0),
            "BondFactory::constructor: treasury is zero address"
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
        string calldata data_
    ) external returns (address) {
        require(
            isCollateralTokenWhitelisted(collateralTokenSymbol_),
            "BondFactory::bond: collateral not whitelisted"
        );

        Bond bond = new Bond();

        emit BondCreated(
            address(bond),
            name_,
            symbol_,
            debtTokens_,
            collateralTokenSymbol_,
            owner(),
            _treasury,
            data_
        );

        bond.initialize(
            name_,
            symbol_,
            debtTokens_,
            _collateralTokensWhitelist[collateralTokenSymbol_],
            _treasury,
            data_
        );
        bond.transferOwnership(owner());

        return address(bond);
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
     * @dev Whether the token symbol has been whitelisted for use as collateral in a Bond.
     */
    function isCollateralTokenWhitelisted(string memory symbol)
        public
        view
        returns (bool)
    {
        return _collateralTokensWhitelist[symbol] != address(0);
    }

    /**
     * @dev Retrieves the address that receives any slashed or remaining funds.
     */
    function treasury() external view returns (address) {
        return _treasury;
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
            "BondFactory::updateCollateralTokenAddress: collateral tokens is zero address"
        );

        string memory symbol = IERC20Metadata(erc20CollateralTokens_).symbol();
        require(
            isCollateralTokenWhitelisted(symbol),
            "BondFactory::updateCollateralTokenAddress: not whitelisted"
        );
        _collateralTokensWhitelist[symbol] = erc20CollateralTokens_;
    }

    /**
     * @dev Permits the owner to update the treasury address.
     * Only applies for bonds created after the update, previously created bonds remain unchanged.
     */
    function setTreasury(address treasury_) external onlyOwner {
        require(
            treasury_ != address(0),
            "BondFactory::setTreasury: treasury is zero address"
        );
        _treasury = treasury_;
    }

    /**
     * @notice When a bond is created, the tokens used as collateral must have been whitelisted.
     *
     * @dev Whitelists the symbol for the collateral token.
     *      On bond creation the symbol returned by the Collateral tokens address must be present in the whitelist.
     */
    function whitelistCollateralToken(string calldata symbol)
        external
        view
        onlyOwner
    {
        require(
            _collateralTokensWhitelist[symbol] == address(0),
            "BondFactory::whitelist: already present"
        );
    }
}
