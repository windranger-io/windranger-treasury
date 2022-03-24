// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./ERC20SingleCollateralBond.sol";
import "./TimeLockMultiRewardBond.sol";

contract SingleCollateralMultiRewardBond is
    ERC20SingleCollateralBond,
    TimeLockMultiRewardBond
{
    /**
     * @param erc20CollateralTokens To avoid being able to break the Bond behaviour, the reference to the collateral
     *              tokens cannot be be changed after init.
     *              To update the tokens address, either follow the proxy convention for the collateral,
     *              or migrate to a new bond.
     * @param data Metadata not required for the operation of the Bond, but needed by external actors.
     * @param expiry Timestamp after which the bond may be expired by anyone.
     * @param minimumDepositHolding Minimum debt holding allowed in the deposit phase. Once the minimum is met,
     *              any sized deposit from that account is allowed, as the minimum has already been met.
     */
    function initialize(
        string calldata name,
        string calldata symbol,
        uint256 debtAmount,
        address erc20CollateralTokens,
        address erc20CapableTreasury,
        uint256 expiry,
        uint256 minimumDepositHolding,
        string calldata data
    ) external initializer {
        __ERC20SingleCollateralBond_init(
            name,
            symbol,
            debtAmount,
            erc20CollateralTokens,
            erc20CapableTreasury,
            expiry,
            minimumDepositHolding,
            data
        );
        __TimeLockMultiRewardBond_init();
    }

    function _isDetTokenHolder(address claimant)
        internal
        override
        returns (bool)
    {
        return balanceOf(claimant) > 0;
    }

    //TODO init for rewards
    //TODO after transfer hook - update rewards
}
