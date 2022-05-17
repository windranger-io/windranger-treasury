# BondMediator



> Mediates between a Bond creator and Bond curator.



*Orchestrates a BondCreator and BondCurator to provide a single function to aggregate the various calls      providing a single function to create and setup a bond for management with the curator.*

## Methods

### VERSION

```solidity
function VERSION() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

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

### bondCreator

```solidity
function bondCreator() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

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

### highestDaoId

```solidity
function highestDaoId() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### initialize

```solidity
function initialize(address factory, address treasury) external nonpayable
```

The _msgSender() is given membership of all roles, to allow granting and future renouncing after others      have been setup.



#### Parameters

| Name | Type | Description |
|---|---|---|
| factory | address | A deployed BondCreator contract to use when creating bonds. |
| treasury | address | Beneficiary of any token sweeping. |

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

### proxiableUUID

```solidity
function proxiableUUID() external view returns (bytes32)
```



*Implementation of the ERC1822 {proxiableUUID} function. This returns the storage slot used by the implementation. It is used to validate that the this implementation remains valid after an upgrade. IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this function revert if invoked through a proxy. This is guaranteed by the `notDelegated` modifier.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### removeWhitelistedCollateral

```solidity
function removeWhitelistedCollateral(uint256 daoId, address erc20CollateralTokens) external nonpayable
```

Permits the owner to remove a collateral token from being accepted in future bonds.

*Only applies for bonds created after the removal, previously created bonds remain unchanged.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | The DAO who is having the collateral token removed from their whitelist. |
| erc20CollateralTokens | address | token to remove from whitelist |

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

### setBondCreator

```solidity
function setBondCreator(address factory) external nonpayable
```

Updates the Bond creator reference.



#### Parameters

| Name | Type | Description |
|---|---|---|
| factory | address | Contract address for the new BondCreator to use from now onwards when creating managed bonds. |

### setDaoMetaData

```solidity
function setDaoMetaData(uint256 daoId, string replacement) external nonpayable
```

Permits updating the meta data for the DAO.



#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| replacement | string | undefined |

### setDaoTreasury

```solidity
function setDaoTreasury(uint256 daoId, address replacement) external nonpayable
```

Permits updating the default DAO treasury address.

*Only applies for bonds created after the update, previously created bond treasury addresses remain unchanged.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | undefined |
| replacement | address | undefined |

### sweepERC20Tokens

```solidity
function sweepERC20Tokens(address tokens, uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokens | address | undefined |
| amount | uint256 | undefined |

### tokenSweepBeneficiary

```solidity
function tokenSweepBeneficiary() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### unpause

```solidity
function unpause() external nonpayable
```

Resumes all paused side affecting functions.




### updateTokenSweepBeneficiary

```solidity
function updateTokenSweepBeneficiary(address newBeneficiary) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newBeneficiary | address | undefined |

### upgradeTo

```solidity
function upgradeTo(address newImplementation) external nonpayable
```



*Upgrade the implementation of the proxy to `newImplementation`. Calls {_authorizeUpgrade}. Emits an {Upgraded} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newImplementation | address | undefined |

### upgradeToAndCall

```solidity
function upgradeToAndCall(address newImplementation, bytes data) external payable
```



*Upgrade the implementation of the proxy to `newImplementation`, and subsequently execute the function call encoded in `data`. Calls {_authorizeUpgrade}. Emits an {Upgraded} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newImplementation | address | undefined |
| data | bytes | undefined |

### whitelistCollateral

```solidity
function whitelistCollateral(uint256 daoId, address erc20CollateralTokens) external nonpayable
```

Adds an ERC20 token to the collateral whitelist.

*When a bond is created, the tokens used as collateral must have been whitelisted.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| daoId | uint256 | The DAO who is having the collateral token whitelisted. |
| erc20CollateralTokens | address | Whitelists the token from now onwards.      On bond creation the tokens address used is retrieved by symbol from the whitelist. |



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

### AdminChanged

```solidity
event AdminChanged(address previousAdmin, address newAdmin)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousAdmin  | address | undefined |
| newAdmin  | address | undefined |

### BeaconUpgraded

```solidity
event BeaconUpgraded(address indexed beacon)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| beacon `indexed` | address | undefined |

### BeneficiaryUpdate

```solidity
event BeneficiaryUpdate(address indexed beneficiary, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| beneficiary `indexed` | address | undefined |
| instigator `indexed` | address | undefined |

### BondCreatorUpdate

```solidity
event BondCreatorUpdate(address indexed previousCreator, address indexed updateCreator, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousCreator `indexed` | address | undefined |
| updateCreator `indexed` | address | undefined |
| instigator `indexed` | address | undefined |

### CreateDao

```solidity
event CreateDao(uint256 indexed id, address indexed treasury, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id `indexed` | uint256 | undefined |
| treasury `indexed` | address | undefined |
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

### ERC20Sweep

```solidity
event ERC20Sweep(address indexed beneficiary, address indexed tokens, uint256 amount, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| beneficiary `indexed` | address | undefined |
| tokens `indexed` | address | undefined |
| amount  | uint256 | undefined |
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

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| implementation `indexed` | address | undefined |



