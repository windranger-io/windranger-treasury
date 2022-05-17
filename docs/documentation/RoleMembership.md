# RoleMembership



> Role based set membership.

Encapsulation of tracking, management and validation of role membership of addresses.  A role is a bytes32 value.  There are two distinct classes of roles:  - Global; without scope limit.  - Dao; membership scoped to that of the key (uint256).

*Meaningful application of role membership is expected to come from derived contracts.      e.g. access control.*

## Methods

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



