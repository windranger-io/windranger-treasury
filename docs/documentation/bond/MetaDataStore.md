# MetaDataStore



> A string storage bucket for metadata.

Useful for off-chain actors to store on data on-chain.          Information related to the contract but not required for contract operations.

*Metadata could include UI related pieces, perhaps in a delimited format to support multiple items.*

## Methods

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



## Events

### MetaDataUpdate

```solidity
event MetaDataUpdate(string data, address indexed instigator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| data  | string | undefined |
| instigator `indexed` | address | undefined |



