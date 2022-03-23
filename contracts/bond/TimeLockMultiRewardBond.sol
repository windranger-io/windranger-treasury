// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

/**
 * @title Multiple reward with time lock support.
 *
 * @notice Supports multiple ERC20 rewards with optional an optional time lock on pull based claiming.
 *         Rewards are not accrued, rather they are given to token holder on redemption of their debt token.
 *
 * @dev Each reward has it's own time lock, allowing different rewards to be claimable at different points in time.
 *      When a guarantor redeems their debt tokens for collateral `_calculateRewardDebt()` must be invoked to
 *      calculate their rewards.
 */
abstract contract TimeLockMultiRewardBond is ContextUpgradeable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    struct RewardPool {
        uint256 amount;
        uint256 timeLock;
    }

    // Multiplier / divider for four decimal places, used in redemption ratio calculation.
    uint256 private constant _REWARD_RATIO_ACCURACY = 1e4;

    mapping(address => mapping(address => uint256))
        private _claimantToRewardPoolDebt;
    mapping(address => RewardPool) private _rewardPool;
    EnumerableSetUpgradeable.AddressSet private _tokens;
    uint256 private _redemptionTimestamp;

    event ClaimReward(address tokens, uint256 amount);
    event RegisterReward(address tokens, uint256 amount, uint256 timeLock);
    event RewardDebt(address tokens, address claimant, uint256 rewardDebt);
    event SetRedemptionTimestamp(uint256 timestamp);
    event UpdateRewardTimeLock(address tokens, uint256 timeLock);

    /**
     * @notice Claims any available rewards for the caller.
     *
     * @dev Rewards are claimable when their are registered and their time lock has expired.
     *
     *  NOTE: If there is nothing to claim, the function completes execution without revert. Handle this problem
     *        with UI. Only display a claim when there an available reward to claim.
     */
    function claimReward() external {
        address claimant = _msgSender();

        for (uint256 i = 0; i < EnumerableSetUpgradeable.length(_tokens); i++) {
            address tokens = EnumerableSetUpgradeable.at(_tokens, i);
            _claimReward(tokens, claimant);
        }
    }

    /**
     * @notice Whether a claimant has any rewards to claim in this block.
     *
     * @dev As there are multiple rewards, some may not yet be claimable.
     */
    function hasRewardsToClaim(address claimant) external returns (bool) {
        require(
            _isDetTokenHolder(claimant) || _isOwedRewards(claimant),
            "Rewards: nothing to claim"
        );

        for (uint256 i; i < EnumerableSetUpgradeable.length(_tokens); i++) {
            address tokens = EnumerableSetUpgradeable.at(_tokens, i);

            if (_hasRegisteredRewards(tokens) && _hasTimeLockExpired(tokens)) {
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
    function rewardTokens() external view returns (address[] memory) {
        return EnumerableSetUpgradeable.values(_tokens);
    }

    /**
     * @notice The amount of time after redemption that the reward is locked before being claimable.
     *
     * @return Time lock in ms.
     */
    function rewardTimeLock(address tokens) external view returns (uint256) {
        require(_hasRegisteredRewards(tokens), "Rewards: no reward tokens");

        return _rewardPool[tokens].timeLock;
    }

    /**
     * @notice The amount in ERC20 token of the reward still outstanding.
     *
     * @return Time total reward from the given ERC20 contract.
     */
    function rewardAmount(address tokens) external view returns (uint256) {
        require(_hasRegisteredRewards(tokens), "Rewards: no reward tokens");

        return _rewardPool[tokens].amount;
    }

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

        uint256 rewardsRatio = (claimantDebtTokens * _REWARD_RATIO_ACCURACY) /
            totalSupply;

        for (uint256 i; i < EnumerableSetUpgradeable.length(_tokens); i++) {
            address tokens = EnumerableSetUpgradeable.at(_tokens, i);
            uint256 rewardDebt = (_rewardPool[tokens].amount * rewardsRatio) /
                _REWARD_RATIO_ACCURACY;

            _claimantToRewardPoolDebt[claimant][tokens] = rewardDebt;
            emit RewardDebt(tokens, claimant, rewardDebt);
        }
    }

    /**
     * @notice Registers ERC20 tokens already transferred to the contract, adding them to the existing reward set.
     *
     * @dev Must be done before redemption is allowed.
     *
     * @param tokens ERC20 register of the tokens to transfer in and later distribute as rewards.
     * @param amount total number of ERC20 tokens to use for reward.
     * @param timeLock ms delay after redemption is allowed, only after which rewards can be claimed.
     *        Value of zero means rewards can be claimed without delay after redemption is allowed.
     *        Will overwrite the existing timeLock if there is already a reward from the ERC20 contract.
     */
    function _registerReward(
        address tokens,
        uint256 amount,
        uint256 timeLock
    ) internal {
        require(tokens != address(0), "Rewards: address is zero");
        require(amount > 0, "Rewards: no reward amount");

        emit RegisterReward(tokens, amount, timeLock);

        _rewardPool[tokens].amount += amount;
        _rewardPool[tokens].timeLock = timeLock;

        require(
            IERC20Upgradeable(tokens).balanceOf(address(this)) >=
                _rewardPool[tokens].amount,
            "Rewards: not enough held"
        );
    }

    /**
     * @notice Overwrites the existing time lock for rewards from a single ERC20.
     *
     * @param tokens ERC20 rewards already registered.
     * @param timeLock ms to lock rewards after redemption is allowed.
     */
    function _updateRewardTimeLock(address tokens, uint256 timeLock) internal {
        require(_hasRegisteredRewards(tokens), "Rewards: no reward tokens");

        _rewardPool[tokens].timeLock = timeLock;

        emit UpdateRewardTimeLock(tokens, timeLock);
    }

    /**
     * @notice The time at which the debt tokens are redeemable.
     *
     * @dev Until a redemption time is set, no rewards are claimable.
     */
    function _setRedemptionTimestamp(uint256 timestamp) internal {
        require(timestamp != 0, "Rewards: zero is invalid time");

        _redemptionTimestamp = timestamp;

        emit SetRedemptionTimestamp(timestamp);
    }

    //slither-disable-next-line naming-convention
    function __TimeLockMultiRewardBond_init() internal onlyInitializing {
        __Context_init();
    }

    /**
     * @notice Whether the claimant holds debt tokens.
     */
    function _isDetTokenHolder(address claimant)
        internal
        virtual
        returns (bool);

    function _claimReward(address tokens, address claimant) private {
        if (_hasTimeLockExpired(tokens)) {
            uint256 amount = _claimantToRewardPoolDebt[claimant][tokens];
            delete _claimantToRewardPoolDebt[claimant][tokens];

            emit ClaimReward(tokens, amount);

            _transferReward(tokens, amount, claimant);
        }
    }

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

    function _hasRegisteredRewards(address tokens) private view returns (bool) {
        return _rewardPool[tokens].amount > 0;
    }

    function _hasTimeLockExpired(address tokens) private view returns (bool) {
        return
            block.timestamp >=
            _rewardPool[tokens].timeLock + _redemptionTimestamp;
    }

    function _isOwedRewards(address claimant) private view returns (bool) {
        for (uint256 i = 0; i < EnumerableSetUpgradeable.length(_tokens); i++) {
            address tokens = EnumerableSetUpgradeable.at(_tokens, i);
            if (_claimantToRewardPoolDebt[claimant][tokens] > 0) {
                return true;
            }
        }

        return false;
    }
}
