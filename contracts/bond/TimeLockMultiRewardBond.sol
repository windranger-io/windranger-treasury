// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./Bond.sol";

/**
 * @title Multiple reward with time lock support.
 *
 * @notice Supports multiple ERC20 rewards with an optional time lock on pull based claiming.
 *         Rewards are not accrued, rather they are given to token holder on redemption of their debt token.
 *
 * @dev Each reward has it's own time lock, allowing different rewards to be claimable at different points in time.
 *      When a guarantor redeems their debt tokens for collateral `_calculateRewardDebt()` must be invoked to
 *      calculate their rewards.
 */
abstract contract TimeLockMultiRewardBond is PausableUpgradeable {
    mapping(address => mapping(address => uint256))
        private _claimantToRewardPoolDebt;
    Bond.TimeLockRewardPool[] private _rewardPools;
    uint256 private _redemptionTimestamp;

    event ClaimReward(address tokens, uint256 amount);
    event RegisterReward(address tokens, uint256 amount, uint256 timeLock);
    event RewardDebt(address tokens, address claimant, uint256 rewardDebt);
    event SetRedemptionTimestamp(uint256 timestamp);
    event UpdateRewardTimeLock(address tokens, uint256 timeLock);

    //TODO need cancel reward? slash reward?
    //TODO expose get all available claims for user
    /**
     * @notice Claims any available rewards for the caller.
     *
     * @dev Rewards are claimable when their are registered and their time lock has expired.
     *
     *  NOTE: If there is nothing to claim, the function completes execution without revert. Handle this problem
     *        with UI. Only display a claim when there an available reward to claim.
     */
    function claimReward() external whenNotPaused {
        address claimant = _msgSender();

        for (uint256 i = 0; i < _rewardPools.length; i++) {
            Bond.TimeLockRewardPool storage rewardPool = _rewardPools[i];
            _claimReward(rewardPool, claimant);
        }
    }

    //TODO get all current claimable rewards

    /**
     * @notice Whether a claimant has any rewards to claim in this block.
     *
     * @dev As there are multiple rewards, some may not yet be claimable.
     */
    function hasRewardsToClaim(address claimant) external view returns (bool) {
        require(
            _isDetTokenHolder(claimant) || _isOwedRewards(claimant),
            "Rewards: nothing to claim"
        );

        for (uint256 i = 0; i < _rewardPools.length; i++) {
            Bond.TimeLockRewardPool storage rewardPool = _rewardPools[i];

            // Intentional use of timestamp for time lock expiry check
            //slither-disable-next-line timestamp
            if (
                _hasRegisteredRewards(rewardPool) &&
                _hasTimeLockExpired(rewardPool)
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * The set of reward ERC20 addresses.
     *
     * NOTE: Values are copied to a memory array be wary of gas cost if call within a transaction!
     *       Expected usage is by view accessors that are queried without any gas fees.
     */
    function allRewardTokens() external view returns (address[] memory) {
        address[] memory tokens = new address[](_rewardPools.length);

        for (uint256 i = 0; i < _rewardPools.length; i++) {
            tokens[i] = _rewardPools[i].tokens;
        }
        return tokens;
    }

    /**
     * @notice The amount of time after redemption that the reward is locked before being claimable.
     *
     * @return Time lock in seconds.
     */
    function rewardTimeLock(address tokens) external view returns (uint128) {
        return _rewardPoolByToken(tokens).timeLock;
    }

    /**
     * @notice The amount in ERC20 token of the reward still outstanding.
     *
     * @return Time total reward from the given ERC20 contract.
     */
    function rewardAmount(address tokens) external view returns (uint256) {
        return _rewardPoolByToken(tokens).amount;
    }

    //TODO triggered on deposit collatearl
    //TODO update on erc20 tranfer of debt
    //TODO this needs to change
    /**
     * @dev Must be called before the claimant debt tokens are burnt, as they are used with total supply in
     *      calculating the rewards.
     */
    function _calculateRewardDebt(
        address claimant,
        uint256 claimantDebtTokens,
        uint256 totalSupply
    ) internal {
        require(claimantDebtTokens < totalSupply, "Rewards: too much debt");

        for (uint256 i = 0; i < _rewardPools.length; i++) {
            Bond.TimeLockRewardPool storage rewardPool = _rewardPools[i];

            uint256 rewardDebt = (rewardPool.amount * claimantDebtTokens) /
                totalSupply;

            _claimantToRewardPoolDebt[claimant][rewardPool.tokens] = rewardDebt;
            emit RewardDebt(rewardPool.tokens, claimant, rewardDebt);
        }
    }

    /**
     * @notice Overwrites the existing time lock for rewards from a single ERC20.
     *
     * @param tokens ERC20 rewards already registered.
     * @param timeLock seconds to lock rewards after redemption is allowed.
     */
    function _updateRewardTimeLock(address tokens, uint128 timeLock)
        internal
        whenNotPaused
    {
        Bond.TimeLockRewardPool storage rewardPool = _rewardPoolByToken(tokens);

        rewardPool.timeLock = timeLock;

        emit UpdateRewardTimeLock(tokens, timeLock);
    }

    /**
     * @notice The time at which the debt tokens are redeemable.
     *
     * @dev Until a redemption time is set, no rewards are claimable.
     */
    function _setRedemptionTimestamp(uint128 timestamp) internal whenNotPaused {
        require(
            _isPresentOrFutureTime(timestamp),
            "Rewards: time already past"
        );

        _redemptionTimestamp = timestamp;

        emit SetRedemptionTimestamp(timestamp);
    }

    /**
     * @param rewardPools Set of rewards claimable after a time lock following bond becoming redeemable.
     */
    //slither-disable-next-line naming-convention
    function __TimeLockMultiRewardBond_init(
        Bond.TimeLockRewardPool[] memory rewardPools
    ) internal onlyInitializing {
        __Pausable_init();

        _enforceUniqueRewardTokens(rewardPools);
        _registerRewardPools(rewardPools);
    }

    //TODO on deposit calculate reward debt

    //TODO need a trigger when transfer occurs, override the ERC20 transfer

    /**
     * @notice Whether the claimant currently holds debt tokens.
     */
    function _isDetTokenHolder(address claimant)
        internal
        view
        virtual
        returns (bool);

    function _claimReward(
        Bond.TimeLockRewardPool storage rewardPool,
        address claimant
    ) private {
        if (_hasTimeLockExpired(rewardPool)) {
            uint256 amount = _claimantToRewardPoolDebt[claimant][
                rewardPool.tokens
            ];
            delete _claimantToRewardPoolDebt[claimant][rewardPool.tokens];

            emit ClaimReward(rewardPool.tokens, amount);

            _transferReward(rewardPool.tokens, amount, claimant);
        }
    }

    function _enforceUniqueRewardTokens(
        Bond.TimeLockRewardPool[] memory rewardPools
    ) private {
        for (uint256 i = 0; i < rewardPools.length; i++) {
            for (uint256 j = i; j < rewardPools.length; j++) {
                if (rewardPools[i].tokens == rewardPools[j].tokens) {
                    revert("Rewards: tokens must be unique");
                }
            }
        }
    }

    function _registerRewardPools(Bond.TimeLockRewardPool[] memory rewardPools)
        private
    {
        for (uint256 i = 0; i < rewardPools.length; i++) {
            _registerRewardPool(i, rewardPools[i]);
        }
    }

    function _registerRewardPool(
        uint256 index,
        Bond.TimeLockRewardPool memory rewardPool
    ) private {
        require(rewardPool.tokens != address(0), "Rewards: address is zero");
        require(rewardPool.amount > 0, "Rewards: no reward amount");

        emit RegisterReward(
            rewardPool.tokens,
            rewardPool.amount,
            rewardPool.timeLock
        );

        _rewardPools[index] = rewardPool;

        require(
            IERC20Upgradeable(rewardPool.tokens).balanceOf(address(this)) >=
                rewardPool.amount,
            "Rewards: not enough held"
        );
    }

    // Claiming multiple rewards in a single function, looping is unavoidable
    //slither-disable-next-line calls-loop
    function _transferReward(
        address tokens,
        uint256 amount,
        address claimant
    ) private {
        require(
            IERC20Upgradeable(tokens).transfer(claimant, amount),
            "Rewards: transfer failed"
        );
    }

    function _hasRegisteredRewards(Bond.TimeLockRewardPool storage reward)
        private
        view
        returns (bool)
    {
        return reward.amount > 0;
    }

    // Intentional use of timestamp for time lock expiry check
    //slither-disable-next-line timestamp
    function _hasTimeLockExpired(Bond.TimeLockRewardPool storage reward)
        private
        view
        returns (bool)
    {
        return block.timestamp >= reward.timeLock + _redemptionTimestamp;
    }

    function _isOwedRewards(address claimant) private view returns (bool) {
        for (uint256 i = 0; i < _rewardPools.length; i++) {
            Bond.TimeLockRewardPool storage rewardPool = _rewardPools[i];

            if (_claimantToRewardPoolDebt[claimant][rewardPool.tokens] > 0) {
                return true;
            }
        }

        return false;
    }

    // Intentional use of timestamp for input validation
    //slither-disable-next-line timestamp
    function _isPresentOrFutureTime(uint128 timestamp)
        private
        view
        returns (bool)
    {
        return timestamp >= block.timestamp;
    }

    function _rewardPoolByToken(address tokens)
        private
        view
        returns (Bond.TimeLockRewardPool storage)
    {
        for (uint256 i = 0; i < _rewardPools.length; i++) {
            Bond.TimeLockRewardPool storage rewardPool = _rewardPools[i];

            if (rewardPool.tokens == tokens) {
                return rewardPool;
            }
        }

        revert("Rewards: tokens not found");
    }
}
