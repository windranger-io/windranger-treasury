# Roles



> Roles within the hierarchical DAO access control schema.

Similar to a Linux permission system there is a super user, with some of the other roles being tiered          amongst each other.  SUPER_USER role the manage for DAO_CREATOR roles, in addition to being a super set to to all other roles functions.  DAO_CREATOR role only business is creating DAOs and their configurations.  DAO_ADMIN role can update the DAOs configuration and may intervene to sweep / flush.  DAO_MEEPLE role is deals with the life cycle of the DAOs products.  SYSTEM_ADMIN role deals with tasks such as pause-ability and the upgrading of contract.



## Methods

### DAO_ADMIN

```solidity
function DAO_ADMIN() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### DAO_CREATOR

```solidity
function DAO_CREATOR() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### DAO_MEEPLE

```solidity
function DAO_MEEPLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### SUPER_USER

```solidity
function SUPER_USER() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### SYSTEM_ADMIN

```solidity
function SYSTEM_ADMIN() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |




