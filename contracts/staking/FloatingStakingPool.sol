// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./StakingPoolInfo.sol";
import "./StakingPool.sol";
import "../RoleAccessControl.sol";

contract FloatingStakingPool is
    Initializable,
    RoleAccessControl,
    ReentrancyGuard,
    StakingPool
{
    struct UserInfo {
        uint128 depositAmount;
    }

    mapping(address => UserInfo) public userInfo;

    function deposit(uint256 amount)
        external
        stakingPeriodNotStarted
        nonReentrant
        stakingPoolNotFull(amount)
    {
        // some sanity checks
        require(
            amount >= stakingPoolInfo.minimumContribution,
            "FixedStaking: min contribution"
        );

        UserInfo storage user = userInfo[_msgSender()];

        user.depositAmount += uint128(amount);

        for (uint256 i = 0; i < stakingPoolInfo.rewardTokens.length; i++) {
            uint256 rewardsPerShare = _computeRewardsPerShare(i);
            stakingPoolInfo.rewardTokens[i].rewardAmountRatio = uint32(
                rewardsPerShare
            );
        }

        stakingPoolInfo.totalStakedAmount += uint128(amount);

        // transfer asset into staking pool (this)
        bool result = stakingPoolInfo.stakeToken.transferFrom(
            _msgSender(),
            address(this),
            amount
        );
        require(result, "FixedStaking: failed to transfer");

        emit Deposit(_msgSender(), amount);
    }

    function withdraw() external rewardsFinalized stakingPeriodComplete {
        UserInfo memory user = userInfo[_msgSender()];
        // checks
        require(user.depositAmount >= 0, "FixedStaking: not elegible");

        delete userInfo[_msgSender()];

        bool result = stakingPoolInfo.stakeToken.transferFrom(
            address(this),
            address(_msgSender()),
            uint256(user.depositAmount)
        );
        require(result, "FixedStaking: stake tx fail");

        for (uint256 i = 0; i < stakingPoolInfo.rewardTokens.length; i++) {
            uint256 amount = uint256(
                stakingPoolInfo.rewardTokens[i].rewardAmountRatio *
                    user.depositAmount
            );
            IERC20 token = IERC20(stakingPoolInfo.rewardTokens[i].rewardToken);

            bool transferResult = token.transferFrom(
                address(this),
                address(_msgSender()),
                amount
            );
            require(transferResult, "FixedStaking: reward tx fail");
            emit WithdrawRewards(_msgSender(), address(token), amount);
        }

        emit Withdraw(_msgSender(), user.depositAmount);
    }

    function withdrawWithoutRewards() external stakingPoolRequirementsUnmet {
        UserInfo memory user = userInfo[_msgSender()];
        require(user.depositAmount >= 0, "FixedStaking: not elegible");

        delete userInfo[_msgSender()];

        bool result = stakingPoolInfo.stakeToken.transferFrom(
            address(this),
            address(_msgSender()),
            uint256(user.depositAmount)
        );

        require(result, "FixedStaking: stake tx fail");

        emit WithdrawWithoutRewards(_msgSender(), user.depositAmount);
    }

    function computeRewardsPerShare(uint256 rewardTokenIndex)
        external
        view
        returns (uint256)
    {
        return _computeRewardsPerShare(rewardTokenIndex);
    }

    function currentExpectedReward(address user)
        external
        view
        returns (uint256[] memory)
    {
        UserInfo memory _userInfo = userInfo[user];
        StakingPoolInfo.StakingPoolData
            memory _stakingPoolInfo = stakingPoolInfo;
        uint256[] memory rewards = new uint256[](
            _stakingPoolInfo.rewardTokens.length
        );

        for (uint256 i = 0; i < _stakingPoolInfo.rewardTokens.length; i++) {
            rewards[i] = uint256(
                _stakingPoolInfo.rewardTokens[i].rewardAmountRatio *
                    _userInfo.depositAmount
            );
        }
        return rewards;
    }

    function initialize(StakingPoolInfo.StakingPoolData calldata _info)
        public
        virtual
        initializer
    {
        __Context_init_unchained();

        stakingPoolInfo = _info;
    }

    function _computeRewardsPerShare(uint256 rewardTokenIndex)
        internal
        view
        returns (uint256)
    {
        StakingPoolInfo.StakingPoolData
            memory _stakingPoolInfo = stakingPoolInfo;

        uint256 availableTokenRewards = _stakingPoolInfo
            .rewardTokens[rewardTokenIndex]
            .totalTokenRewardsAvailable;

        return availableTokenRewards / _stakingPoolInfo.totalStakedAmount;
    }
}
