# BondAccessControlBox



> Box to test the access control dedicated for the Bond family of contracts.

An empty box for testing the provided modifiers and management for access control required throughout the Bond contracts.



## Methods

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



