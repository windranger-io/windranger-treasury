# BondPortal



> Entry point for the Bond family of contract.



*Orchestrates the various Bond contracts to provide a single function to aggregate the various calls.*

## Methods

### createDao

```solidity
function createDao(address erc20CapableTreasury) external nonpayable returns (uint256)
```

Initialises a new DAO with essential configuration.



#### Parameters

| Name | Type | Description |
|---|---|---|
| erc20CapableTreasury | address | Treasury that receives forfeited collateral. Must not be address zero. |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | ID for the created DAO. |

### createManagedBond

```solidity
function createManagedBond(uint256 daoId, Bond.MetaData metadata, Bond.Settings configuration, Bond.TimeLockRewardPool[] rewards) external nonpayable returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| metadata | Bond.MetaData | undefined |
| configuration | Bond.Settings | undefined |
| rewards | Bond.TimeLockRewardPool[] | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |




