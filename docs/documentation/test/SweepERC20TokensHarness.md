# SweepERC20TokensHarness









## Methods

### setBeneficiary

```solidity
function setBeneficiary(address beneficiary) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| beneficiary | address | undefined |

### sweepERC20Tokens

```solidity
function sweepERC20Tokens(address token, uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |
| amount | uint256 | undefined |

### tokenSweepBeneficiary

```solidity
function tokenSweepBeneficiary() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |



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



