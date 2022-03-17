// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

import "./StakingPoolBase.sol";
import "./StakingPool.sol";

contract FixedStakingPool is StakingPoolBase {
    function deposit(uint256 amount)
        external
        stakingPeriodNotStarted
        stakingPoolNotFull(amount)
        nonReentrant
    {
        require(
            amount >= stakingPoolInfo.minimumContribution,
            "FixedStaking: min contribution"
        );

        User storage user = users[_msgSender()];
        user.depositAmount += uint128(amount);

        emit Deposit(_msgSender(), amount);

        for (uint256 i = 0; i < stakingPoolInfo.rewardTokens.length; i++) {
            user.rewardAmounts[i] += _computeRewards(uint128(amount), i);
        }

        stakingPoolInfo.totalStakedAmount += uint128(amount);

        require(
            stakingPoolInfo.stakeToken.transferFrom(
                _msgSender(),
                address(this),
                amount
            ),
            "FixedStaking: failed to transfer"
        );
    }

    // withdraw BOTH stake and rewards
    function withdraw()
        external
        stakingPeriodComplete
        rewardsAvailable
        nonReentrant
    {
        User memory user = users[_msgSender()];
        // checks
        require(user.depositAmount > 0, "FixedStaking: not eligible");
        delete users[_msgSender()];

        emit Withdraw(_msgSender(), user.depositAmount);

        bool result = stakingPoolInfo.stakeToken.transfer(
            _msgSender(),
            uint256(user.depositAmount)
        );
        require(result, "FixedStaking: stake tx fail");

        // now transfer reward tokens
        for (uint256 i = 0; i < stakingPoolInfo.rewardTokens.length; i++) {
            uint256 amount = uint256(user.rewardAmounts[i]);
            IERC20 token = IERC20(stakingPoolInfo.rewardTokens[i].rewardToken);

            emit WithdrawRewards(_msgSender(), address(token), amount);

            require(
                token.transferFrom(address(this), _msgSender(), amount),
                "FixedStaking: reward tx fail"
            );
        }
    }

    function computeRewards(address receipient, uint256 rewardTokenIndex)
        external
        view
        returns (uint128)
    {
        return
            _computeRewards(users[receipient].depositAmount, rewardTokenIndex);
    }

    function _computeRewards(uint128 amount, uint256 rewardTokenIndex)
        internal
        view
        returns (uint128)
    {
        return
            uint128(
                (amount *
                    stakingPoolInfo
                        .rewardTokens[rewardTokenIndex]
                        .rewardAmountRatio) / 1 ether
            );
    }
}
