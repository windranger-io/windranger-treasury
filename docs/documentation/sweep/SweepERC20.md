# SweepERC20



> Adds the ability to sweep ERC20 tokens to a beneficiary address





## Methods

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



