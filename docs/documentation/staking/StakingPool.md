# StakingPool



> StakingPool with optional fixed or floating token rewards

Users can deposit a stake token into the pool up to the specified pool maximum contribution. If the minimum criteria for the pool to go ahead are met, stake tokens are locked for an epochDuration. After this period expires the user can withdraw their stake token and reward tokens (if available) separately. The amount of rewards is determined by the pools rewardType - a floating reward ratio is updated on each deposit while fixed tokens rewards are calculated once per user.



## Methods

### VERSION

```solidity
function VERSION() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### adminEmergencyRewardSweep

```solidity
function adminEmergencyRewardSweep() external nonpayable
```






### currentExpectedRewards

```solidity
function currentExpectedRewards(address user) external view returns (uint256[])
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| user | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | undefined |

### currentRewards

```solidity
function currentRewards(address user) external view returns (struct StakingPool.RewardOwed[])
```

Returns the final amount of reward due for a user



#### Parameters

| Name | Type | Description |
|---|---|---|
| user | address | address to calculate rewards for |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | StakingPool.RewardOwed[] | undefined |

### deposit

```solidity
function deposit(uint128 amount) external nonpayable
```

Only entry point for a user to deposit into the staking pool



#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint128 | Amount of stake tokens to deposit |

### earlyWithdraw

```solidity
function earlyWithdraw() external nonpayable
```

Withdraw stake tokens when minimum pool conditions to begin are not met




### emergencyMode

```solidity
function emergencyMode() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### emergencyWithdraw

```solidity
function emergencyWithdraw() external nonpayable
```

Withdraw stake tokens when admin has enabled emergency mode




### enableEmergencyMode

```solidity
function enableEmergencyMode() external nonpayable
```






### getUser

```solidity
function getUser(address activeUser) external view returns (struct StakingPool.User)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| activeUser | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | StakingPool.User | undefined |

### grantDaoAdminRole

```solidity
function grantDaoAdminRole(uint256 daoId, address account) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| account | address | undefined |

### grantDaoCreatorRole

```solidity
function grantDaoCreatorRole(address account) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

### grantDaoMeepleRole

```solidity
function grantDaoMeepleRole(uint256 daoId, address account) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| account | address | undefined |

### grantSuperUserRole

```solidity
function grantSuperUserRole(address account) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

### grantSysAdminRole

```solidity
function grantSysAdminRole(address account) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

### hasDaoAdminAccess

```solidity
function hasDaoAdminAccess(uint256 daoId, address account) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### hasDaoCreatorAccess

```solidity
function hasDaoCreatorAccess(address account) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### hasDaoMeepleAccess

```solidity
function hasDaoMeepleAccess(uint256 daoId, address account) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### hasDaoRole

```solidity
function hasDaoRole(uint256 daoId, bytes32 role, address account) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| role | bytes32 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### hasGlobalRole

```solidity
function hasGlobalRole(bytes32 role, address account) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### hasSuperUserAccess

```solidity
function hasSuperUserAccess(address account) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### hasSysAdminAccess

```solidity
function hasSysAdminAccess(address account) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### initialize

```solidity
function initialize(StakingPoolLib.Config info, bool paused, uint32 rewardsTimestamp) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| info | StakingPoolLib.Config | undefined |
| paused | bool | undefined |
| rewardsTimestamp | uint32 | undefined |

### initializeRewardTokens

```solidity
function initializeRewardTokens(address benefactor, StakingPoolLib.Reward[] rewards) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| benefactor | address | undefined |
| rewards | StakingPoolLib.Reward[] | undefined |

### isRedeemable

```solidity
function isRedeemable() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isRewardsAvailable

```solidity
function isRewardsAvailable() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isStakingPeriodComplete

```solidity
function isStakingPeriodComplete() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### pause

```solidity
function pause() external nonpayable
```






### paused

```solidity
function paused() external view returns (bool)
```



*Returns true if the contract is paused, and false otherwise.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### revokeDaoAdminRole

```solidity
function revokeDaoAdminRole(uint256 daoId, address account) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| account | address | undefined |

### revokeDaoCreatorRole

```solidity
function revokeDaoCreatorRole(address account) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

### revokeDaoMeepleRole

```solidity
function revokeDaoMeepleRole(uint256 daoId, address account) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| account | address | undefined |

### revokeSuperUserRole

```solidity
function revokeSuperUserRole(address account) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

### revokeSysAdminRole

```solidity
function revokeSysAdminRole(address account) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

### rewardsAvailableTimestamp

```solidity
function rewardsAvailableTimestamp() external view returns (uint32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint32 | undefined |

### setRewardsAvailableTimestamp

```solidity
function setRewardsAvailableTimestamp(uint32 timestamp) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| timestamp | uint32 | undefined |

### stakingPoolData

```solidity
function stakingPoolData() external view returns (struct StakingPoolLib.Config)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | StakingPoolLib.Config | undefined |

### totalStakedAmount

```solidity
function totalStakedAmount() external view returns (uint128)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint128 | undefined |

### unpause

```solidity
function unpause() external nonpayable
```






### withdraw

```solidity
function withdraw() external nonpayable
```

Withdraw both stake and reward tokens when the stake period is complete




### withdrawRewards

```solidity
function withdrawRewards() external nonpayable
```

Withdraw only reward tokens. Stake must have already been withdrawn.




### withdrawStake

```solidity
function withdrawStake() external nonpayable
```

Withdraw only stake tokens after staking period is complete. Reward tokens may not be available yet.






## Events

### Deposit

```solidity
event Deposit(address indexed user, uint256 depositAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| depositAmount  | uint256 | undefined |

### EmergencyMode

```solidity
event EmergencyMode(address indexed admin)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| admin `indexed` | address | undefined |

### GrantDaoRole

```solidity
event GrantDaoRole(uint256 indexed daoId, bytes32 indexed role, address account, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId `indexed` | uint256 | undefined |
| role `indexed` | bytes32 | undefined |
| account  | address | undefined |
| instigator `indexed` | address | undefined |

### GrantGlobalRole

```solidity
event GrantGlobalRole(bytes32 indexedrole, address account, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| indexedrole  | bytes32 | undefined |
| account  | address | undefined |
| instigator `indexed` | address | undefined |

### InitializeRewards

```solidity
event InitializeRewards(address rewardTokens, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| rewardTokens  | address | undefined |
| amount  | uint256 | undefined |

### NoRewards

```solidity
event NoRewards(address indexed user)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |

### Paused

```solidity
event Paused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### RevokeDaoRole

```solidity
event RevokeDaoRole(uint256 indexed daoId, bytes32 indexed role, address account, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId `indexed` | uint256 | undefined |
| role `indexed` | bytes32 | undefined |
| account  | address | undefined |
| instigator `indexed` | address | undefined |

### RevokeGlobalRole

```solidity
event RevokeGlobalRole(bytes32 indexed role, address account, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account  | address | undefined |
| instigator `indexed` | address | undefined |

### RewardsAvailableTimestamp

```solidity
event RewardsAvailableTimestamp(uint32 rewardsAvailableTimestamp)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| rewardsAvailableTimestamp  | uint32 | undefined |

### Unpaused

```solidity
event Unpaused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### WithdrawRewards

```solidity
event WithdrawRewards(address indexed user, address rewardToken, uint256 rewards)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| rewardToken  | address | undefined |
| rewards  | uint256 | undefined |

### WithdrawStake

```solidity
event WithdrawStake(address indexed user, uint256 stake)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| stake  | uint256 | undefined |



