# Treasury Specification

## Supported assets

- ETH, native coin
- ERC-20
- NFTs
- ZK proofs (with their associated EIP-712 encoded API)

## Configuration

- min, max
- periodic, daily to hourly range 

## Security

- security: layered pools, e.g., sequence w increasing automation
- security: automation layers
- security: multi-sig support

## Analytics

- analytics: track reconciled amounts against accounts receivable
- analytics: track reconciled amounts against accounts payable

### Context

- does not contain roles
- permissible actions defined in a separate context, e.g., roles (allows reuse across components, e.g., lending)
- 

## Inbound treasury

- support for logging accounts receivable

## Outbound treasury

- support for handling anticipated commitments for 30 days

## Pluggability and extensibility

- lending mechanism
- insurance
- 

## Treasury user stories

- asset buy backs
- liquidations
- buy now, pay later per asset
- buy now, pay later per treasury
