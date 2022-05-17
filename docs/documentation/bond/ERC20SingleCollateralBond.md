# ERC20SingleCollateralBond



> A Bond is an issuance of debt tokens, which are exchange for deposit of collateral.

A single type of ERC20 token is accepted as collateral. The Bond uses a single redemption model. Before redemption, receiving and slashing collateral is permitted, while after redemption, redeem (by guarantors) or complete withdrawal (by owner) is allowed.

*A single token type is held by the contract as collateral, with the Bond ERC20 token being the debt.*

## Methods

### VERSION

```solidity
function VERSION() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

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

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```



*See {IERC20-allowance}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined |
| spender | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### approve

```solidity
function approve(address spender, uint256 amount) external nonpayable returns (bool)
```



*See {IERC20-approve}. NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on `transferFrom`. This is semantically equivalent to an infinite approval. Requirements: - `spender` cannot be the zero address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```



*See {IERC20-balanceOf}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### collateral

```solidity
function collateral() external view returns (uint256)
```

How much collateral held by the bond is owned to the Guarantors.

*Collateral has come from guarantors, with the balance changes on deposit, redeem, slashing and flushing.      This value may differ to balanceOf(this), if collateral tokens have been directly transferred      i.e. direct transfer interaction with the token contract, rather then using the Bond functions.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### collateralSlashed

```solidity
function collateralSlashed() external view returns (uint256)
```

Sum of collateral moved from the Bond to the Treasury by slashing.

*Other methods of performing moving of collateral outside of slashing, are not included.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### collateralTokens

```solidity
function collateralTokens() external view returns (address)
```

The ERC20 contract being used as collateral.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### debtTokens

```solidity
function debtTokens() external view returns (uint256)
```

Balance of debt tokens held by the bond.

*Number of debt tokens that can still be swapped for collateral token (if before redemption state),          or the amount of under-collateralization (if during redemption state).*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### debtTokensOutstanding

```solidity
function debtTokensOutstanding() external view returns (uint256)
```

Balance of debt tokens held by the guarantors.

*Number of debt tokens still held by Guarantors. The number only reduces when guarantors redeem          (swap their debt tokens for collateral).*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### decimals

```solidity
function decimals() external view returns (uint8)
```



*Returns the number of decimals used to get its user representation. For example, if `decimals` equals `2`, a balance of `505` tokens should be displayed to a user as `5.05` (`505 / 10 ** 2`). Tokens usually opt for a value of 18, imitating the relationship between Ether and Wei. This is the value {ERC20} uses, unless this function is overridden; NOTE: This information is only used for _display_ purposes: it in no way affects any of the arithmetic of the contract, including {IERC20-balanceOf} and {IERC20-transfer}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

### decreaseAllowance

```solidity
function decreaseAllowance(address spender, uint256 subtractedValue) external nonpayable returns (bool)
```



*Atomically decreases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address. - `spender` must have allowance for the caller of at least `subtractedValue`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | undefined |
| subtractedValue | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

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

### excessDebtTokens

```solidity
function excessDebtTokens() external view returns (uint256)
```

Balance of debt tokes outstanding when the redemption state was entered.

*As the collateral deposited is a 1:1, this is amount of collateral that was not received.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | zero if redemption is not yet allowed or full collateral was met, otherwise the number of debt tokens          remaining without matched deposit when redemption was allowed, |

### expire

```solidity
function expire() external nonpayable
```

Moves all remaining collateral to the Treasury and pauses the bond.

*A fail safe, callable by anyone after the Bond has expired.       If control is lost, this can be used to move all remaining collateral to the Treasury,       after which petitions for redemption can be made.  Expiry operates separately to pause, so a paused contract can be expired (fail safe for loss of control).*


### expiryTimestamp

```solidity
function expiryTimestamp() external view returns (uint256)
```

The timestamp compared with the block time to determine expiry.

*Timestamp is the Unix time.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getSlashByIndex

```solidity
function getSlashByIndex(uint256 index) external view returns (struct ERC20SingleCollateralBond.Slash)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| index | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | ERC20SingleCollateralBond.Slash | undefined |

### getSlashes

```solidity
function getSlashes() external view returns (struct ERC20SingleCollateralBond.Slash[])
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | ERC20SingleCollateralBond.Slash[] | undefined |

### hasFullCollateral

```solidity
function hasFullCollateral() external view returns (bool)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) external nonpayable returns (bool)
```



*Atomically increases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| spender | address | undefined |
| addedValue | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### initialDebtTokens

```solidity
function initialDebtTokens() external view returns (uint256)
```

Debt tokens created on Bond initialization.

*Number of debt tokens minted on init. The total supply of debt tokens will decrease, as redeem burns them.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### metaData

```solidity
function metaData() external view returns (string)
```

The storage box for metadata. Information not required by the contract for operations.

*Information related to the contract but not needed by the contract.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### minimumDeposit

```solidity
function minimumDeposit() external view returns (uint256)
```

Minimum amount of debt allowed for the created Bonds.

*Avoids micro holdings, as some operations cost scale linear to debt holders.      Once an account holds the minimum, any deposit from is acceptable as their holding is above the minimum.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### name

```solidity
function name() external view returns (string)
```



*Returns the name of the token.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

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

*The ony side effecting (non view or pure function) function exempt from pausing is expire().*


### paused

```solidity
function paused() external view returns (bool)
```



*Returns true if the contract is paused, and false otherwise.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

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

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


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

### symbol

```solidity
function symbol() external view returns (string)
```



*Returns the symbol of the token, usually a shorter version of the name.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined |

### tokenSweepBeneficiary

```solidity
function tokenSweepBeneficiary() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```



*See {IERC20-totalSupply}.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### transfer

```solidity
function transfer(address to, uint256 amount) external nonpayable returns (bool)
```



*See {IERC20-transfer}. Requirements: - `to` cannot be the zero address. - the caller must have a balance of at least `amount`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 amount) external nonpayable returns (bool)
```



*See {IERC20-transferFrom}. Emits an {Approval} event indicating the updated allowance. This is not required by the EIP. See the note at the beginning of {ERC20}. NOTE: Does not update the allowance if the current allowance is the maximum `uint256`. Requirements: - `from` and `to` cannot be the zero address. - `from` must have a balance of at least `amount`. - the caller must have allowance for ``from``&#39;s tokens of at least `amount`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| from | address | undefined |
| to | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### treasury

```solidity
function treasury() external view returns (address)
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




## Events

### AllowRedemption

```solidity
event AllowRedemption(address indexed authorizer, string reason)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| authorizer `indexed` | address | undefined |
| reason  | string | undefined |

### Approval

```solidity
event Approval(address indexed owner, address indexed spender, uint256 value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| spender `indexed` | address | undefined |
| value  | uint256 | undefined |

### BeneficiaryUpdate

```solidity
event BeneficiaryUpdate(address indexed beneficiary, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| beneficiary `indexed` | address | undefined |
| instigator `indexed` | address | undefined |

### DebtIssue

```solidity
event DebtIssue(address indexed receiver, address indexed debTokens, uint256 debtAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| receiver `indexed` | address | undefined |
| debTokens `indexed` | address | undefined |
| debtAmount  | uint256 | undefined |

### Deposit

```solidity
event Deposit(address indexed depositor, address indexed collateralTokens, uint256 collateralAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| depositor `indexed` | address | undefined |
| collateralTokens `indexed` | address | undefined |
| collateralAmount  | uint256 | undefined |

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

### Expire

```solidity
event Expire(address indexed treasury, address indexed collateralTokens, uint256 collateralAmount, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| treasury `indexed` | address | undefined |
| collateralTokens `indexed` | address | undefined |
| collateralAmount  | uint256 | undefined |
| instigator `indexed` | address | undefined |

### FullCollateral

```solidity
event FullCollateral(address indexed collateralTokens, uint256 collateralAmount, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| collateralTokens `indexed` | address | undefined |
| collateralAmount  | uint256 | undefined |
| instigator `indexed` | address | undefined |

### MetaDataUpdate

```solidity
event MetaDataUpdate(string data, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| data  | string | undefined |
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

### PartialCollateral

```solidity
event PartialCollateral(address indexed collateralTokens, uint256 collateralAmount, address indexed debtTokens, uint256 debtRemaining, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| collateralTokens `indexed` | address | undefined |
| collateralAmount  | uint256 | undefined |
| debtTokens `indexed` | address | undefined |
| debtRemaining  | uint256 | undefined |
| instigator `indexed` | address | undefined |

### Paused

```solidity
event Paused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

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

### Redemption

```solidity
event Redemption(address indexed redeemer, address indexed debtTokens, uint256 debtAmount, address indexed collateralTokens, uint256 collateralAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemer `indexed` | address | undefined |
| debtTokens `indexed` | address | undefined |
| debtAmount  | uint256 | undefined |
| collateralTokens `indexed` | address | undefined |
| collateralAmount  | uint256 | undefined |

### SlashDeposits

```solidity
event SlashDeposits(address indexed collateralTokens, uint256 collateralAmount, string reason, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| collateralTokens `indexed` | address | undefined |
| collateralAmount  | uint256 | undefined |
| reason  | string | undefined |
| instigator `indexed` | address | undefined |

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| to `indexed` | address | undefined |
| value  | uint256 | undefined |

### Unpaused

```solidity
event Unpaused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### WithdrawCollateral

```solidity
event WithdrawCollateral(address indexed treasury, address indexed collateralTokens, uint256 collateralAmount, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| treasury `indexed` | address | undefined |
| collateralTokens `indexed` | address | undefined |
| collateralAmount  | uint256 | undefined |
| instigator `indexed` | address | undefined |



