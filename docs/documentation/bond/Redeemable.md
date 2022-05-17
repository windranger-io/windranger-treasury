# Redeemable



> Encapsulates the state of being redeemable.

The state of being redeemable is boolean and single direction transition from false to true.



## Methods

### redeemable

```solidity
function redeemable() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### redemptionReason

```solidity
function redemptionReason() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |



## Events

### RedeemableUpdate

```solidity
event RedeemableUpdate(bool isRedeemable, string reason, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| isRedeemable  | bool | undefined |
| reason  | string | undefined |
| instigator `indexed` | address | undefined |



