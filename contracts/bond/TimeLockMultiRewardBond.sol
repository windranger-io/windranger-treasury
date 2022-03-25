// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

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
    struct RewardPool {
        address tokens;
        uint128 amount;
        uint128 timeLock;
    }

    mapping(address => mapping(address => uint256))
        private _claimantToRewardPoolDebt;
    RewardPool[] private _rewardPools;
    uint256 private _redemptionTimestamp;

    event ClaimReward(address tokens, uint256 amount);
    event RegisterReward(address tokens, uint256 amount, uint256 timeLock);
    event RewardDebt(address tokens, address claimant, uint256 rewardDebt);
    event SetRedemptionTimestamp(uint256 timestamp);
    event UpdateRewardTimeLock(address tokens, uint256 timeLock);

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
            RewardPool storage rewardPool = _rewardPools[i];
            _claimReward(rewardPool, claimant);
        }
    }

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
            RewardPool storage rewardPool = _rewardPools[i];

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
            RewardPool storage rewardPool = _rewardPools[i];

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
        RewardPool storage rewardPool = _rewardPoolByToken(tokens);

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

    //TODO init with rewards?
    //slither-disable-next-line naming-convention
    function __TimeLockMultiRewardBond_init() internal onlyInitializing {
        __Context_init();

        //TODO need reward tokens & amounts

        //TODO enforce unique tokens in rewards
    }

    //TODO need a trigger when transfer occurs, override the ERC20 transfer

    /**
     * @notice Whether the claimant holds debt tokens.
     */
    function _isDetTokenHolder(address claimant)
        internal
        view
        virtual
        returns (bool);

    function _claimReward(RewardPool storage rewardPool, address claimant)
        private
    {
        if (_hasTimeLockExpired(rewardPool)) {
            uint256 amount = _claimantToRewardPoolDebt[claimant][
                rewardPool.tokens
            ];
            delete _claimantToRewardPoolDebt[claimant][rewardPool.tokens];

            emit ClaimReward(rewardPool.tokens, amount);

            _transferReward(rewardPool.tokens, amount, claimant);
        }
    }

    //TODO must register no init only
    /**
     * @notice Registers ERC20 tokens already transferred to the contract, adding them to the existing reward set.
     *
     * @dev Must be done before redemption is allowed.
     *
     * @param tokens ERC20 register of the tokens to transfer in and later distribute as rewards.
     * @param amount total number of ERC20 tokens to use for reward.
     * @param timeLock seconds delay after redemption is allowed, only after which rewards can be claimed.
     *        Value of zero means rewards can be claimed without delay after redemption is allowed.
     *        Will overwrite the existing timeLock if there is already a reward from the ERC20 contract.
     */
    function _registerReward(
        uint256 index,
        address tokens,
        uint128 amount,
        uint128 timeLock
    ) private {
        require(tokens != address(0), "Rewards: address is zero");
        require(amount > 0, "Rewards: no reward amount");

        emit RegisterReward(tokens, amount, timeLock);

        _rewardPools[index].tokens = tokens;
        _rewardPools[index].amount = amount;
        _rewardPools[index].timeLock = timeLock;

        require(
            IERC20Upgradeable(tokens).balanceOf(address(this)) >= amount,
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

    function _hasRegisteredRewards(RewardPool storage reward)
        private
        view
        returns (bool)
    {
        return reward.amount > 0;
    }

    // Intentional use of timestamp for time lock expiry check
    //slither-disable-next-line timestamp
    function _hasTimeLockExpired(RewardPool storage reward)
        private
        view
        returns (bool)
    {
        return block.timestamp >= reward.timeLock + _redemptionTimestamp;
    }

    function _isOwedRewards(address claimant) private view returns (bool) {
        for (uint256 i = 0; i < _rewardPools.length; i++) {
            RewardPool storage rewardPool = _rewardPools[i];

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
        returns (RewardPool storage)
    {
        for (uint256 i = 0; i < _rewardPools.length; i++) {
            RewardPool storage rewardPool = _rewardPools[i];

            if (rewardPool.tokens == tokens) {
                return rewardPool;
            }
        }

        revert("Rewards: tokens not found");
    }
}
