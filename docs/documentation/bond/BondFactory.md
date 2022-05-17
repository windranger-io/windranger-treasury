# BondFactory



> Creates Bond contracts.



*An upgradable contract that encapsulates the Bond implementation and associated deployment cost.*

## Methods

### VERSION

```solidity
function VERSION() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### createBond

```solidity
function createBond(Bond.MetaData metadata, Bond.Settings configuration, Bond.TimeLockRewardPool[] rewards, address treasury) external nonpayable returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| metadata | Bond.MetaData | undefined |
| configuration | Bond.Settings | undefined |
| rewards | Bond.TimeLockRewardPool[] | undefined |
| treasury | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

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

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### setTokenSweepBeneficiary

```solidity
function setTokenSweepBeneficiary(address newBeneficiary) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newBeneficiary | address | undefined |

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

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### unpause

```solidity
function unpause() external nonpayable
```

Resumes all paused side affecting functions.






## Events

### BeneficiaryUpdate

```solidity
event BeneficiaryUpdate(address indexed beneficiary, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| beneficiary `indexed` | address | undefined |
| instigator `indexed` | address | undefined |

### CreateBond

```solidity
event CreateBond(address indexed bond, Bond.MetaData metadata, Bond.Settings configuration, Bond.TimeLockRewardPool[] rewards, address indexed treasury, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| bond `indexed` | address | undefined |
| metadata  | Bond.MetaData | undefined |
| configuration  | Bond.Settings | undefined |
| rewards  | Bond.TimeLockRewardPool[] | undefined |
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

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### Paused

```solidity
event Paused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### Unpaused

```solidity
event Unpaused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |



