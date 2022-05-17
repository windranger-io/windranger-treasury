# DaoBondConfigurationBox



> Box to test the access control dedicated for the Bond family of contracts.

An empty box for testing the provided modifiers and management for access control required throughout the Bond contracts.



## Methods

### daoBondConfiguration

```solidity
function daoBondConfiguration(address erc20CapableTreasury) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| erc20CapableTreasury | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

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

### removeWhitelistedDaoCollateral

```solidity
function removeWhitelistedDaoCollateral(uint256 daoId, address tokens) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| tokens | address | undefined |

### setDaoMetaData

```solidity
function setDaoMetaData(uint256 daoId, string replacementMetaData) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| replacementMetaData | string | undefined |

### setDaoTreasury

```solidity
function setDaoTreasury(uint256 daoId, address replacementTreasury) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| replacementTreasury | address | undefined |

### whitelistDaoCollateral

```solidity
function whitelistDaoCollateral(uint256 daoId, address erc20CollateralTokens) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| erc20CollateralTokens | address | undefined |



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



