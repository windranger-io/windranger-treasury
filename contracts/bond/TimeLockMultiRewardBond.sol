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
 *
 *      When a guarantor deposits collateral or transfers debt tokens (for a purpose other than redemption), then
 *      _calculateRewardDebt() must be called to keep their rewards updated.
 */
abstract contract TimeLockMultiRewardBond is PausableUpgradeable {
    struct ClaimableReward {
        address tokens;
        uint256 amount;
    }

    mapping(address => mapping(address => uint256))
        private _claimantToRewardPoolDebt;
    Bond.TimeLockRewardPool[] private _rewardPools;
    uint256 private _redemptionTimestamp;

    event ClaimReward(address tokens, uint256 amount);
    event RegisterReward(address tokens, uint256 amount, uint256 timeLock);
    event RewardDebt(address tokens, address claimant, uint256 rewardDebt);
    event SetRedemptionTimestamp(uint256 timestamp);
    event UpdateRewardTimeLock(address tokens, uint256 timeLock);

    /**
     * @notice Makes a function callable only when the contract has the redemption times set.
     *
     * @dev Reverts unless the redemption timestamp has been set.
     */
    modifier whenRedemptionTimestampSet() {
        require(_isRedemptionTimeSet(), "Rewards: redemption time not set");
        _;
    }

    /**
     * @notice Makes a function callable only when the contract has not yet had a redemption times set.
     *
     * @dev Reverts unless the redemption timestamp has been set.
     */
    modifier whenNoRedemptionTimestamp() {
        require(!_isRedemptionTimeSet(), "Rewards: redemption time set");
        _;
    }

    /**
     * @notice Claims any available rewards for the caller.
     *
     * @dev Rewards are claimable when their are registered and their time lock has expired.
     *
     *  NOTE: If there is nothing to claim, the function completes execution without revert. Handle this problem
     *        with UI. Only display a claim when there an available reward to claim.
     */
    function claimAllAvailableRewards()
        external
        whenNotPaused
        whenRedemptionTimestampSet
    {
        address claimant = _msgSender();

        for (uint256 i = 0; i < _rewardPools.length; i++) {
            Bond.TimeLockRewardPool storage rewardPool = _rewardPools[i];
            _claimReward(claimant, rewardPool);
        }
    }

    /**
     * @notice The set of total rewards outstanding for the Bond.
     *
     * @dev These rewards will be split proportionally between the debt holders.
     *
     *      After claiming, these value remain unchanged (as they are not used after redemption is allowed,
     *      only for calculations after deposits and transfers).
     *
     * NOTE: Values are copied to a memory array be wary of gas cost if call within a transaction!
     *       Expected usage is by view accessors that are queried without any gas fees.
     */
    function allRewardPools()
        external
        view
        returns (Bond.TimeLockRewardPool[] memory)
    {
        Bond.TimeLockRewardPool[]
            memory rewards = new Bond.TimeLockRewardPool[](_rewardPools.length);

        for (uint256 i = 0; i < _rewardPools.length; i++) {
            rewards[i] = _rewardPools[i];
        }
        return rewards;
    }

    /**
     * @notice Retrieves the set full set of rewards, with the amounts populated for only claimable rewards.
     *
     * @dev Rewards that are not yet claimable, or have already been claimed are zero.
     *
     * NOTE: Values are copied to a memory array be wary of gas cost if call within a transaction!
     *       Expected usage is by view accessors that are queried without any gas fees.
     */
    // Intentional use of timestamp for time lock expiry check
    //slither-disable-next-line timestamp
    function availableRewards()
        external
        view
        returns (ClaimableReward[] memory)
    {
        ClaimableReward[] memory rewards = new ClaimableReward[](
            _rewardPools.length
        );
        address claimant = _msgSender();

        for (uint256 i = 0; i < _rewardPools.length; i++) {
            Bond.TimeLockRewardPool storage rewardPool = _rewardPools[i];
            rewards[i].tokens = rewardPool.tokens;

            if (
                _hasTimeLockExpired(rewardPool) &&
                _hasRewardDebt(claimant, rewardPool)
            ) {
                rewards[i].amount = _rewardDebt(claimant, rewardPool);
            }
        }

        return rewards;
    }

    function redemptionTimestamp() external view returns (uint256) {
        return _redemptionTimestamp;
    }

    /**
     * @notice Reward debt currently assigned to claimant.
     *
     * @dev These rewards are the sum owed pending the time lock after redemption timestamp.
     */
    function rewardDebt(address claimant, address tokens)
        external
        view
        returns (uint256)
    {
        return _claimantToRewardPoolDebt[claimant][tokens];
    }

    /**
     * @notice Calculate the rewards the claimant will be entitled to after redemption and corresponding lock up period.
     *
     * @dev Must be called when the guarantor deposits collateral or on transfer of debt tokens, but not when they
     *      the claimant redeems, otherwise you will erase their rewards.
     */
    function _calculateRewardDebt(
        address claimant,
        uint256 claimantDebtTokens,
        uint256 totalSupply
    ) internal whenNotPaused whenNoRedemptionTimestamp {
        require(claimantDebtTokens <= totalSupply, "Rewards: too much debt");

        for (uint256 i = 0; i < _rewardPools.length; i++) {
            Bond.TimeLockRewardPool storage rewardPool = _rewardPools[i];

            uint256 owed = (rewardPool.amount * claimantDebtTokens) /
                totalSupply;

            _claimantToRewardPoolDebt[claimant][rewardPool.tokens] = owed;
            emit RewardDebt(rewardPool.tokens, claimant, owed);
        }
    }

    function _updateRewardTimeLock(address tokens, uint128 timeLock)
        internal
        whenNotPaused
        whenNoRedemptionTimestamp
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
    function _setRedemptionTimestamp(uint128 timestamp)
        internal
        whenNotPaused
        whenNoRedemptionTimestamp
    {
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

    /**
     * @dev When there are insufficient fund the transfer causes the transaction to revert,
     *      either as a revert in the ERC20 or when the return boolean is false.
     */
    function _claimReward(
        address claimant,
        Bond.TimeLockRewardPool storage rewardPool
    ) private {
        if (_hasTimeLockExpired(rewardPool)) {
            address tokens = rewardPool.tokens;
            uint256 amount = _claimantToRewardPoolDebt[claimant][tokens];
            delete _claimantToRewardPoolDebt[claimant][tokens];

            emit ClaimReward(tokens, amount);

            _transferReward(tokens, amount, claimant);
        }
    }

    function _enforceUniqueRewardTokens(
        Bond.TimeLockRewardPool[] memory rewardPools
    ) private {
        for (uint256 i = 0; i < rewardPools.length; i++) {
            // Ensure no later entries contain the same tokens address
            uint256 next = i + 1;
            if (next < rewardPools.length) {
                for (uint256 j = next; j < rewardPools.length; j++) {
                    if (rewardPools[i].tokens == rewardPools[j].tokens) {
                        revert("Rewards: tokens must be unique");
                    }
                }
            }
        }
    }

    function _registerRewardPools(Bond.TimeLockRewardPool[] memory rewardPools)
        private
    {
        for (uint256 i = 0; i < rewardPools.length; i++) {
            _registerRewardPool(rewardPools[i]);
        }
    }

    function _registerRewardPool(Bond.TimeLockRewardPool memory rewardPool)
        private
    {
        require(rewardPool.tokens != address(0), "Rewards: address is zero");
        require(rewardPool.amount > 0, "Rewards: no reward amount");

        emit RegisterReward(
            rewardPool.tokens,
            rewardPool.amount,
            rewardPool.timeLock
        );

        _rewardPools.push(rewardPool);
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

    function _hasRewardDebt(
        address claimant,
        Bond.TimeLockRewardPool storage rewardPool
    ) private view returns (bool) {
        return _claimantToRewardPoolDebt[claimant][rewardPool.tokens] > 0;
    }

    function _rewardDebt(
        address claimant,
        Bond.TimeLockRewardPool storage rewardPool
    ) private view returns (uint256) {
        return _claimantToRewardPoolDebt[claimant][rewardPool.tokens];
    }

    // Intentional use of timestamp for time lock expiry check
    //slither-disable-next-line timestamp
    function _hasTimeLockExpired(Bond.TimeLockRewardPool storage rewardPool)
        private
        view
        returns (bool)
    {
        return block.timestamp >= rewardPool.timeLock + _redemptionTimestamp;
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

    function _isRedemptionTimeSet() private view returns (bool) {
        return _redemptionTimestamp > 0;
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
