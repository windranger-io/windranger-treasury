// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./StakingPool.sol";
import "./StakingPoolLib.sol";
import "./StakingPoolCreator.sol";
import "../RoleAccessControl.sol";
import "../Version.sol";
import "../sweep/SweepERC20.sol";

contract StakingPoolFactory is
    RoleAccessControl,
    PausableUpgradeable,
    StakingPoolCreator,
    SweepERC20,
    Version
{
    event StakingPoolCreated(
        address indexed stakingPool,
        address treasury,
        address indexed creator,
        StakingPoolLib.Reward[] rewardTokens,
        address stakeToken,
        uint128 epochStartTimestamp,
        uint128 epochDuration,
        uint128 minimumContribution,
        StakingPoolLib.RewardType rewardType
    );

    function pause() external whenNotPaused atLeastSysAdminRole {
        _pause();
    }

    function unpause() external whenPaused atLeastSysAdminRole {
        _unpause();
    }

    function createStakingPool(
        StakingPoolLib.Config calldata config,
        bool launchPaused,
        uint32 rewardsAvailableTimestamp
    ) external override whenNotPaused returns (address) {
        StakingPool stakingPool = new StakingPool();

        emit StakingPoolCreated(
            address(stakingPool),
            config.treasury,
            _msgSender(),
            config.rewardTokens,
            address(config.stakeToken),
            config.epochStartTimestamp,
            config.epochDuration,
            config.minimumContribution,
            config.rewardType
        );

        stakingPool.initialize(
            config,
            launchPaused,
            rewardsAvailableTimestamp,
            config.treasury
        );
        stakingPool.transferOwnership(_msgSender());

        return address(stakingPool);
    }

    function initialize(address beneficiary) external initializer {
        __Pausable_init();
        __RoleAccessControl_init();
        __TokenSweep_init(beneficiary);
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
}
