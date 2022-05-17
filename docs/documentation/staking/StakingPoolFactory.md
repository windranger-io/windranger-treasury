# StakingPoolFactory









## Methods

### VERSION

```solidity
function VERSION() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### createStakingPool

```solidity
function createStakingPool(StakingPoolLib.Config config, bool launchPaused, uint32 rewardsAvailableTimestamp) external nonpayable returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| config | StakingPoolLib.Config | undefined |
| launchPaused | bool | undefined |
| rewardsAvailableTimestamp | uint32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

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
function initialize() external nonpayable
```






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

### unpause

```solidity
function unpause() external nonpayable
```








## Events

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

### StakingPoolCreated

```solidity
event StakingPoolCreated(address indexed stakingPool, address treasury, address indexed creator, StakingPoolLib.Reward[] rewardTokens, address stakeToken, uint128 epochStartTimestamp, uint128 epochDuration, uint128 minimumContribution, enum StakingPoolLib.RewardType rewardType)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| stakingPool `indexed` | address | undefined |
| treasury  | address | undefined |
| creator `indexed` | address | undefined |
| rewardTokens  | StakingPoolLib.Reward[] | undefined |
| stakeToken  | address | undefined |
| epochStartTimestamp  | uint128 | undefined |
| epochDuration  | uint128 | undefined |
| minimumContribution  | uint128 | undefined |
| rewardType  | enum StakingPoolLib.RewardType | undefined |

### Unpaused

```solidity
event Unpaused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |



