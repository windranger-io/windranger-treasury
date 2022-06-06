// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "./StakingPoolCurator.sol";
import "./StakingPoolFactory.sol";
import "../DaoConfiguration.sol";
import "../Version.sol";
import "../sweep/SweepERC20.sol";

/**
 * @title Mediates between a StakingPool creator and StakingPool curator.
 *
 * @dev Orchestrates a StakingPoolCreator and StakingPoolCurator to provide a single function to aggregate the various calls
 *      providing a single function to create and setup a staking pool for management with the curator.
 */
contract StakingPoolMediator is
    DaoConfiguration,
    StakingPoolCurator,
    SweepERC20,
    UUPSUpgradeable,
    Version
{
    StakingPoolFactory private _creator;

    event CreateDao(
        uint256 indexed id,
        address indexed treasury,
        address indexed instigator
    );

    event StakingPoolFactoryUpdate(
        address indexed previousCreator,
        address indexed updateCreator,
        address indexed instigator
    );

    /**
     * @notice The _msgSender() is given membership of all roles, to allow granting and future renouncing after others
     *      have been setup.
     *
     * @param factory A deployed BondCreator contract to use when creating bonds.
     * @param treasury Beneficiary of any token sweeping.
     */
    function initialize(StakingPoolFactory factory, address treasury)
        external
        initializer
    {
        require(
            AddressUpgradeable.isContract(address(factory)),
            "SPM: creator not a contract"
        );

        __StakingPoolCurator_init();
        __DaoConfiguration_init();
        __UUPSUpgradeable_init();
        __TokenSweep_init(treasury);

        _creator = factory;
    }

    function createDao(address erc20CapableTreasury)
        external
        atLeastDaoCreatorRole
        returns (uint256)
    {
        uint256 id = _daoConfiguration(erc20CapableTreasury);
        _grantDaoCreatorAdminRoleInTheirDao(id);

        emit CreateDao(id, erc20CapableTreasury, _msgSender());

        return id;
    }

    function createStakingPool(
        StakingPoolLib.Config calldata config,
        bool launchPaused,
        uint32 rewardsAvailableTimestamp
    )
        external
        whenNotPaused
        atLeastDaoMeepleRole(config.daoId)
        returns (address)
    {
        require(_isValidDaoId(config.daoId), "SPM: invalid DAO Id");
        require(
            isAllowedDaoCollateral(config.daoId, address(config.stakeToken)),
            "SPM: collateral not whitelisted"
        );

        // Reentrancy warning from an emitted event, which needs the Bond, created by an external call above.
        //slither-disable-next-line reentrancy-events
        address stakingPool = _creator.createStakingPool(
            config,
            launchPaused,
            rewardsAvailableTimestamp
        );

        _addStakingPool(config.daoId, stakingPool);

        return stakingPool;
    }

    /**
     * @notice Updates the Bond creator reference.
     *
     * @param factory Contract address for the new BondCreator to use from now onwards when creating managed bonds.
     */
    function setStakingPoolFactory(address factory)
        external
        whenNotPaused
        atLeastSysAdminRole
    {
        require(
            AddressUpgradeable.isContract(factory),
            "SPM: creator not a contract"
        );
        address previousCreator = address(_creator);
        require(factory != previousCreator, "BM: matches existing");

        emit StakingPoolFactoryUpdate(
            address(_creator),
            address(factory),
            _msgSender()
        );
        _creator = StakingPoolFactory(factory);
    }

    /**
     * @notice Permits updating the default DAO treasury address.
     *
     * @dev Only applies for bonds created after the update, previously created bond treasury addresses remain unchanged.
     */
    function setDaoTreasury(uint256 daoId, address replacement)
        external
        whenNotPaused
        atLeastDaoAdminRole(daoId)
    {
        _setDaoTreasury(daoId, replacement);
    }

    function updateTokenSweepBeneficiary(address newBeneficiary)
        external
        whenNotPaused
        onlySuperUserRole
    {
        _setTokenSweepBeneficiary(newBeneficiary);
    }

    function sweepERC20Tokens(address tokens, uint256 amount)
        external
        whenNotPaused
        onlySuperUserRole
    {
        _sweepERC20Tokens(tokens, amount);
    }

    /**
     * @notice Adds an ERC20 token to the collateral whitelist.
     *
     * @dev When a bond is created, the tokens used as collateral must have been whitelisted.
     *
     * @param daoId The DAO who is having the collateral token whitelisted.
     * @param erc20CollateralTokens Whitelists the token from now onwards.
     *      On bond creation the tokens address used is retrieved by symbol from the whitelist.
     */
    function whitelistCollateral(uint256 daoId, address erc20CollateralTokens)
        external
        whenNotPaused
        atLeastDaoAdminRole(daoId)
    {
        _whitelistDaoCollateral(daoId, erc20CollateralTokens);
    }

    function stakingPoolCreator() external view returns (address) {
        return address(_creator);
    }

    /**
     * @notice Permits only the relevant admins to perform proxy upgrades.
     *
     * @dev Only applicable when deployed as implementation to a UUPS proxy.
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        atLeastSysAdminRole
    {}

    function _grantDaoCreatorAdminRoleInTheirDao(uint256 daoId) private {
        if (_hasGlobalRole(Roles.DAO_CREATOR, _msgSender())) {
            _grantDaoRole(daoId, Roles.DAO_ADMIN, _msgSender());
        }
    }
}
