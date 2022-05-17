# DaoBondConfiguration









## Methods

### daoCollateralSymbolWhitelist

```solidity
function daoCollateralSymbolWhitelist(uint256 daoId) external view returns (string[])
```

Returns a list of the whitelisted tokens&#39; symbols.

*NOTE This is a convenience getter function, due to looking an unknown gas cost,             never call within a transaction, only use a call from an EOA.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | Internal ID of the DAO whose collateral symbol list is wanted. |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string[] | undefined |

### daoMetaData

```solidity
function daoMetaData(uint256 daoId) external view returns (string)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### daoTreasury

```solidity
function daoTreasury(uint256 daoId) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### highestDaoId

```solidity
function highestDaoId() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### isAllowedDaoCollateral

```solidity
function isAllowedDaoCollateral(uint256 daoId, address erc20CollateralTokens) external view returns (bool)
```

The whitelisted ERC20 token address associated for a symbol.



#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | Internal ID of the DAO whose collateral whitelist list will be checked. |
| erc20CollateralTokens | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | When present in the whitelist, the token address, otherwise address zero. |



## Events

### AddCollateralWhitelist

```solidity
event AddCollateralWhitelist(uint256 indexed daoId, address indexed collateralTokens, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId `indexed` | uint256 | undefined |
| collateralTokens `indexed` | address | undefined |
| instigator `indexed` | address | undefined |

### DaoMetaDataUpdate

```solidity
event DaoMetaDataUpdate(uint256 indexed daoId, string data, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId `indexed` | uint256 | undefined |
| data  | string | undefined |
| instigator `indexed` | address | undefined |

### DaoTreasuryUpdate

```solidity
event DaoTreasuryUpdate(uint256 indexed daoId, address indexed treasury, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId `indexed` | uint256 | undefined |
| treasury `indexed` | address | undefined |
| instigator `indexed` | address | undefined |

### RemoveCollateralWhitelist

```solidity
event RemoveCollateralWhitelist(uint256 indexed daoId, address indexed collateralTokens, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId `indexed` | uint256 | undefined |
| collateralTokens `indexed` | address | undefined |
| instigator `indexed` | address | undefined |



