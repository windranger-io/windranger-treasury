# SweepERC721TokensHarness









## Methods

### setBeneficiary

```solidity
function setBeneficiary(address beneficiary) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| beneficiary | address | undefined |

### sweepERC721Tokens

```solidity
function sweepERC721Tokens(address token, uint256 tokenId) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |
| tokenId | uint256 | undefined |

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



