// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

import "./StakingPoolBase.sol";
import "./StakingPool.sol";
import "../RoleAccessControl.sol";

import "hardhat/console.sol";

contract FloatingStakingPool is StakingPoolBase {
    function deposit(uint256 amount)
        external
        stakingPeriodNotStarted
        nonReentrant
        stakingPoolNotFull(amount)
    {
        require(
            amount >= stakingPoolInfo.minimumContribution,
            "StakingPool: min contribution"
        );

        User storage user = users[_msgSender()];

        user.depositAmount += uint128(amount);

        for (uint256 i = 0; i < stakingPoolInfo.rewardTokens.length; i++) {
            uint256 rewardsPerShare = _computeRewardsPerShare(i);
            stakingPoolInfo.rewardTokens[i].rewardAmountRatio = uint32(
                rewardsPerShare
            );
        }

        stakingPoolInfo.totalStakedAmount += uint128(amount);

        emit Deposit(_msgSender(), amount);

        require(
            stakingPoolInfo.stakeToken.transferFrom(
                _msgSender(),
                address(this),
                amount
            ),
            "StakingPool: failed to transfer"
        );
    }

    function withdraw()
        external
        stakingPeriodComplete
        rewardsAvailable
        nonReentrant
    {
        User memory user = users[_msgSender()];
        require(user.depositAmount > 0, "StakingPool: not eligible");

        delete users[_msgSender()];
        emit Withdraw(_msgSender(), user.depositAmount);
        require(
            stakingPoolInfo.stakeToken.transfer(
                _msgSender(),
                uint256(user.depositAmount)
            ),
            "StakingPool: stake tx fail"
        );

        for (uint256 i = 0; i < stakingPoolInfo.rewardTokens.length; i++) {
            uint256 amount = uint256(
                stakingPoolInfo.rewardTokens[i].rewardAmountRatio *
                    user.depositAmount
            );
            IERC20 token = IERC20(stakingPoolInfo.rewardTokens[i].rewardToken);

            emit WithdrawRewards(_msgSender(), address(token), amount);

            require(
                token.transfer(_msgSender(), amount),
                "FixedStaking: reward tx fail"
            );
        }
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
        User memory _user = users[user];
        StakingPool.Data memory _stakingPoolInfo = stakingPoolInfo;
        uint256[] memory rewards = new uint256[](
            _stakingPoolInfo.rewardTokens.length
        );

        for (uint256 i = 0; i < _stakingPoolInfo.rewardTokens.length; i++) {
            rewards[i] = uint256(
                (_stakingPoolInfo.rewardTokens[i].rewardAmountRatio *
                    _user.depositAmount) / 1 ether
            );
        }
        return rewards;
    }

    function _computeRewardsPerShare(uint256 rewardTokenIndex)
        internal
        view
        returns (uint256)
    {
        StakingPool.Data memory _stakingPoolInfo = stakingPoolInfo;

        uint256 availableTokenRewards = _stakingPoolInfo
            .rewardTokens[rewardTokenIndex]
            .totalTokenRewardsAvailable;

        return availableTokenRewards / _stakingPoolInfo.totalStakedAmount;
    }
}
