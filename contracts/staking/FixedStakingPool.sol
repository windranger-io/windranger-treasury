// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

import "./StakingPoolInfo.sol";
import "./StakingPool.sol";

contract FixedStakingPool is StakingPool {
    struct UserInfo {
        uint128 depositAmount;
        uint128[] rewardAmounts;
    }

    mapping(address => UserInfo) public userInfo;

    function deposit(uint256 amount)
        external
        stakingPeriodNotStarted
        stakingPoolNotFull(amount)
    {
        require(
            amount >= stakingPoolInfo.minimumContribution,
            "FixedStaking: min contribution"
        );

        UserInfo storage user = userInfo[_msgSender()];
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

    function withdraw() external rewardsFinalized stakingPeriodComplete {
        UserInfo memory user = userInfo[_msgSender()];
        // checks
        require(user.depositAmount > 0, "FixedStaking: not elegible");

        // effects
        delete userInfo[_msgSender()];

        emit Withdraw(_msgSender(), user.depositAmount);

        // Interactions
        bool result = stakingPoolInfo.stakeToken.transferFrom(
            address(this),
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

    function withdrawWithoutRewards() external stakingPoolRequirementsUnmet {
        _withdrawWithoutRewards();
    }

    function emergencyWithdraw() external emergencyModeEnabled {
        _withdrawWithoutRewards();
    }

    function initializeRewardTokens(
        address treasury,
        StakingPoolInfo.RewardToken[] calldata _rewardTokens
    ) external atLeastDaoMeepleRole(stakingPoolInfo.daoId) {
        _initializeRewardTokens(treasury, _rewardTokens);
    }

    function adminEmergencyRewardSweep()
        external
        atLeastDaoAminRole(stakingPoolInfo.daoId)
        emergencyModeEnabled
    {
        _adminEmergencyRewardSweep();
    }

    function enableEmergencyMode()
        external
        atLeastDaoAminRole(stakingPoolInfo.daoId)
    {
        stakingPoolInfo.emergencyMode = true;
    }

    function computeRewards(address receipient, uint256 rewardTokenIndex)
        external
        view
        returns (uint128)
    {
        return
            _computeRewards(
                userInfo[receipient].depositAmount,
                rewardTokenIndex
            );
    }

    function _withdrawWithoutRewards() internal {
        UserInfo memory user = userInfo[_msgSender()];
        require(user.depositAmount > 0, "FixedStaking: not eligible");

        delete userInfo[_msgSender()];

        emit WithdrawWithoutRewards(_msgSender(), user.depositAmount);

        bool result = stakingPoolInfo.stakeToken.transferFrom(
            address(this),
            address(_msgSender()),
            uint256(user.depositAmount)
        );

        require(result, "FixedStaking: stake tx fail");
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
