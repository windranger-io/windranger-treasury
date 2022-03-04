// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./StakingAccessControl.sol";
import "./StakingPoolInfo.sol";
import "./StakingPool.sol";

contract FixedStakingPool is Initializable, StakingAccessControl, StakingPool {
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
        // some sanity checks
        require(
            amount >= stakingPoolInfo.minimumContribution,
            "FixedStaking: min contribution"
        );

        // load user info
        UserInfo storage user = userInfo[_msgSender()];

        // update user info
        user.depositAmount += uint128(amount);

        for (uint256 i = 0; i < stakingPoolInfo.rewardTokens.length; i++) {
            user.rewardAmounts[i] += _computeRewards(uint128(amount), i);
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

        // effects
        delete userInfo[_msgSender()];

        // Interactions

        bool result = stakingPoolInfo.stakeToken.transferFrom(
            address(this),
            address(_msgSender()),
            uint256(user.depositAmount)
        );
        require(result, "FixedStaking: stake tx fail");

        // now transfer reward tokens
        for (uint256 i = 0; i < stakingPoolInfo.rewardTokens.length; i++) {
            uint256 amount = uint256(user.rewardAmounts[i]);
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

    function initialize(StakingPoolInfo.StakingPoolData calldata _info)
        public
        virtual
        initializer
    {
        __StakingAccessControl_init();
        __Context_init_unchained();

        stakingPoolInfo = _info;
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
