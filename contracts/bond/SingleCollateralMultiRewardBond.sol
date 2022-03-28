// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./ERC20SingleCollateralBond.sol";
import "./TimeLockMultiRewardBond.sol";
import "./Bond.sol";

contract SingleCollateralMultiRewardBond is
    ERC20SingleCollateralBond,
    TimeLockMultiRewardBond
{
    function allowRedemption(string calldata reason) external override {
        _allowRedemption(reason);
        _setRedemptionTimestamp(uint128(block.timestamp));
    }

    function deposit(uint256 amount) external override {
        address claimant = _msgSender();
        uint256 claimantDebt = balanceOf(claimant) + amount;
        _calculateRewardDebt(claimant, claimantDebt, totalSupply());
        _deposit(amount);
    }

    function initialize(
        Bond.MetaData calldata metadata,
        Bond.Settings calldata configuration,
        Bond.TimeLockRewardPool[] calldata rewards,
        address erc20CapableTreasury
    ) external initializer {
        __ERC20SingleCollateralBond_init(
            metadata,
            configuration,
            erc20CapableTreasury
        );
        __TimeLockMultiRewardBond_init(rewards);
    }

    function updateRewardTimeLock(address tokens, uint128 timeLock)
        external
        override
        onlyOwner
    {
        _updateRewardTimeLock(tokens, timeLock);
    }

    /**
     * @dev When debt tokens are transferred before redemption is allowed, the new holder gains full proportional
     *      rewards for the new holding of debt tokens, while the previous holder looses any entitlement.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (amount > 0 && !redeemable()) {
            uint256 supply = totalSupply();
            _calculateRewardDebt(from, balanceOf(from), supply);
            _calculateRewardDebt(to, balanceOf(to), supply);
        }
    }
}
