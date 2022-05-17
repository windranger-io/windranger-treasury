# TimeLockMultiRewardBond



> Multiple reward with time lock support.

Supports multiple ERC20 rewards with an optional time lock on pull based claiming.         Rewards are not accrued, rather they are given to token holder on redemption of their debt token.

*Each reward has it&#39;s own time lock, allowing different rewards to be claimable at different points in time.      When a guarantor deposits collateral or transfers debt tokens (for a purpose other than redemption), then      _calculateRewardDebt() must be called to keep their rewards updated.*

## Methods

### allRewardPools

```solidity
function allRewardPools() external view returns (struct Bond.TimeLockRewardPool[])
```

The set of total rewards outstanding for the Bond.

*These rewards will be split proportionally between the debt holders.      After claiming, these value remain unchanged (as they are not used after redemption is allowed,      only for calculations after deposits and transfers). NOTE: Values are copied to a memory array be wary of gas cost if call within a transaction!       Expected usage is by view accessors that are queried without any gas fees.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | Bond.TimeLockRewardPool[] | undefined |

### availableRewards

```solidity
function availableRewards() external view returns (struct TimeLockMultiRewardBond.ClaimableReward[])
```

Retrieves the set full set of rewards, with the amounts populated for only claimable rewards.

*Rewards that are not yet claimable, or have already been claimed are zero. NOTE: Values are copied to a memory array be wary of gas cost if call within a transaction!       Expected usage is by view accessors that are queried without any gas fees.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | TimeLockMultiRewardBond.ClaimableReward[] | undefined |

### claimAllAvailableRewards

```solidity
function claimAllAvailableRewards() external nonpayable
```

Claims any available rewards for the caller.

*Rewards are claimable when their are registered and their time lock has expired.  NOTE: If there is nothing to claim, the function completes execution without revert. Handle this problem        with UI. Only display a claim when there an available reward to claim.*


### paused

```solidity
function paused() external view returns (bool)
```



*Returns true if the contract is paused, and false otherwise.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### redemptionTimestamp

```solidity
function redemptionTimestamp() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### rewardDebt

```solidity
function rewardDebt(address claimant, address tokens) external view returns (uint256)
```

Reward debt currently assigned to claimant.

*These rewards are the sum owed pending the time lock after redemption timestamp.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| claimant | address | undefined |
| tokens | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### timeLockRewardPools

```solidity
function timeLockRewardPools() external view returns (struct Bond.TimeLockRewardPool[])
```

Initial time locked reward pools available for participating in the Bond.

*The initial configuration for the pools is retrieve .i.e. not decremented as rewards are claimed. NOTE: Values are copied to a memory array be wary of gas cost if call within a transaction!       Expected usage is by view accessors that are queried without any gas fees.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | Bond.TimeLockRewardPool[] | undefined |



## Events

### ClaimReward

```solidity
event ClaimReward(address indexed tokens, uint256 amount, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokens `indexed` | address | undefined |
| amount  | uint256 | undefined |
| instigator `indexed` | address | undefined |

### Paused

```solidity
event Paused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### RedemptionTimestampUpdate

```solidity
event RedemptionTimestampUpdate(uint256 timestamp, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| timestamp  | uint256 | undefined |
| instigator `indexed` | address | undefined |

### RegisterReward

```solidity
event RegisterReward(address indexed tokens, uint256 amount, uint256 timeLock, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokens `indexed` | address | undefined |
| amount  | uint256 | undefined |
| timeLock  | uint256 | undefined |
| instigator `indexed` | address | undefined |

### RewardDebt

```solidity
event RewardDebt(address indexed tokens, address indexed claimant, uint256 rewardDebt, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokens `indexed` | address | undefined |
| claimant `indexed` | address | undefined |
| rewardDebt  | uint256 | undefined |
| instigator `indexed` | address | undefined |

### RewardTimeLockUpdate

```solidity
event RewardTimeLockUpdate(address indexed tokens, uint256 timeLock, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokens `indexed` | address | undefined |
| timeLock  | uint256 | undefined |
| instigator `indexed` | address | undefined |

### Unpaused

```solidity
event Unpaused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |



