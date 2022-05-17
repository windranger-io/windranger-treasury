# SingleCollateralBond









## Methods

### allowRedemption

```solidity
function allowRedemption(string reason) external nonpayable
```

Transitions the Bond state, from being non-redeemable (accepting deposits and slashing) to          redeemable (accepting redeem and withdraw collateral).

*Debt tokens are not allowed to be redeemed before the owner grants permission.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| reason | string | undefined |

### deposit

```solidity
function deposit(uint256 amount) external nonpayable
```

Deposit swaps collateral tokens for an equal amount of debt tokens.

*Before the deposit can be made, this contract must have been approved to transfer the given amount from the ERC20 token being used as collateral.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | The number of collateral token to transfer from the _msgSender().          Must be in the range of one to the number of debt tokens available for swapping.          The _msgSender() receives the debt tokens. |

### pause

```solidity
function pause() external nonpayable
```

Pauses most side affecting functions.

*The ony side effecting (non view or pure function) function exempt from pausing is expire().*


### redeem

```solidity
function redeem(uint256 amount) external nonpayable
```

Redeem swaps debt tokens for collateral tokens.

*Converts the amount of debt tokens owned by the sender, at the exchange ratio determined by the remaining  amount of collateral against the remaining amount of debt.  There are operations that reduce the held collateral, while the debt remains constant.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | The number of debt token to transfer from the _msgSender().          Must be in the range of one to the number of debt tokens available for swapping.          The _msgSender() receives the redeemed collateral tokens. |

### setMetaData

```solidity
function setMetaData(string data) external nonpayable
```

Replaces any stored metadata.

*As metadata is not pertinent for Bond operations, this may be anything, such as a delimitated string.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| data | string | Information useful for off-chain actions e.g. performance factor, assessment date, rewards pool. |

### setTreasury

```solidity
function setTreasury(address replacement) external nonpayable
```

Permits the owner to update the Treasury address.

*treasury is the recipient of slashed, expired or withdrawn collateral.          Must be a non-zero address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| replacement | address | Treasury recipient for future operations. Must not be zero address. |

### slash

```solidity
function slash(uint256 amount, string reason) external nonpayable
```

Enact a penalty for guarantors, a loss of a portion of their bonded collateral.          The designated Treasury is the recipient for the slashed collateral.

*The penalty can range between one and all of the collateral. As the amount of debt tokens remains the same. Slashing reduces the collateral tokens, so each debt token is redeemable for less collateral, altering the redemption ratio calculated on allowRedemption().*

#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | The number of bonded collateral token to transfer from the Bond to the Treasury.          Must be in the range of one to the number of collateral tokens held by the Bond. |
| reason | string | undefined |

### sweepERC20Tokens

```solidity
function sweepERC20Tokens(address tokens, uint256 amount) external nonpayable
```

Sweep any non collateral ERC20 tokens to the beneficiary address



#### Parameters

| Name | Type | Description |
|---|---|---|
| tokens | address | The registry for the ERC20 token to transfer, |
| amount | uint256 | How many tokens, in the ERC20&#39;s decimals to transfer. |

### unpause

```solidity
function unpause() external nonpayable
```

Resumes all paused side affecting functions.




### updateRewardTimeLock

```solidity
function updateRewardTimeLock(address tokens, uint128 timeLock) external nonpayable
```

Overwrites the existing time lock for a Bond reward.



#### Parameters

| Name | Type | Description |
|---|---|---|
| tokens | address | ERC20 rewards already registered. |
| timeLock | uint128 | seconds to lock rewards after redemption is allowed. |

### withdrawCollateral

```solidity
function withdrawCollateral() external nonpayable
```

Permits the owner to transfer all collateral held by the Bond to the Treasury.

*Intention is to sweeping up excess collateral from redemption ration calculation, such as  when there has      been slashing. Slashing can result in collateral remaining due to flooring.  Can also provide an emergency extracting moving of funds out of the Bond by the owner.*





