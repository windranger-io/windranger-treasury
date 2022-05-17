# BondCurator



> Manages interactions with Bond contracts.

A central place to discover created Bonds and apply access control to them.

*Owns of all Bonds it manages, guarding function accordingly allows finer access control to be provided.*

## Methods

### bondAllowRedemption

```solidity
function bondAllowRedemption(uint256 daoId, address bond, string reason) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| bond | address | undefined |
| reason | string | undefined |

### bondAt

```solidity
function bondAt(uint256 daoId, uint256 index) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| index | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### bondCount

```solidity
function bondCount(uint256 daoId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### bondPause

```solidity
function bondPause(uint256 daoId, address bond) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| bond | address | undefined |

### bondSetMetaData

```solidity
function bondSetMetaData(uint256 daoId, address bond, string data) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| bond | address | undefined |
| data | string | undefined |

### bondSetTreasury

```solidity
function bondSetTreasury(uint256 daoId, address bond, address replacement) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| bond | address | undefined |
| replacement | address | undefined |

### bondSlash

```solidity
function bondSlash(uint256 daoId, address bond, uint256 amount, string reason) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| bond | address | undefined |
| amount | uint256 | undefined |
| reason | string | undefined |

### bondSweepERC20Tokens

```solidity
function bondSweepERC20Tokens(uint256 daoId, address bond, address tokens, uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| bond | address | undefined |
| tokens | address | undefined |
| amount | uint256 | undefined |

### bondUnpause

```solidity
function bondUnpause(uint256 daoId, address bond) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| bond | address | undefined |

### bondUpdateRewardTimeLock

```solidity
function bondUpdateRewardTimeLock(uint256 daoId, address bond, address tokens, uint128 timeLock) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| bond | address | undefined |
| tokens | address | undefined |
| timeLock | uint128 | undefined |

### bondWithdrawCollateral

```solidity
function bondWithdrawCollateral(uint256 daoId, address bond) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| bond | address | undefined |

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

### pause

```solidity
function pause() external nonpayable
```

Pauses most side affecting functions.




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

Resumes all paused side affecting functions.






## Events

### AddBond

```solidity
event AddBond(uint256 indexed daoId, address indexed bond, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId `indexed` | uint256 | undefined |
| bond `indexed` | address | undefined |
| instigator `indexed` | address | undefined |

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

### Unpaused

```solidity
event Unpaused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |



