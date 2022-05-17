# Treasury



> Treasury is where the valuables are kept.





## Methods

### addERC20

```solidity
function addERC20(address token) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined |

### depositERC20

```solidity
function depositERC20(uint256 amount, string tokenAbbreviation) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |
| tokenAbbreviation | string | undefined |

### depositERC721

```solidity
function depositERC721(uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |

### depositETH

```solidity
function depositETH(uint256 amount) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined |

### doSomethingWith721Token

```solidity
function doSomethingWith721Token(contract IERC721 nftAddress, uint256 tokenId) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| nftAddress | contract IERC721 | undefined |
| tokenId | uint256 | undefined |

### onERC721Received

```solidity
function onERC721Received(address operator, address from, uint256 tokenId, bytes data) external nonpayable returns (bytes4)
```



*Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom} by `operator` from `from`, this function is called. It must return its Solidity selector to confirm the token transfer. If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted. The selector can be obtained in Solidity with `IERC721Receiver.onERC721Received.selector`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| operator | address | undefined |
| from | address | undefined |
| tokenId | uint256 | undefined |
| data | bytes | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes4 | undefined |

### withdrawERC20

```solidity
function withdrawERC20(address destination, string tokenAbbreviation, uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| destination | address | undefined |
| tokenAbbreviation | string | undefined |
| amount | uint256 | undefined |

### withdrawERC721

```solidity
function withdrawERC721(address destination, uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| destination | address | undefined |
| amount | uint256 | undefined |

### withdrawETH

```solidity
function withdrawETH(address payable to) external payable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| to | address payable | undefined |




