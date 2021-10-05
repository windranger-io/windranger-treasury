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
- support for reconciliation
- support for handling anticipated commitments for 30 days
- support for different period of contributions/flow (daily to hourly)
- inbound flow can be controlled by same BitDAO multi-sig
- inbound can use allow lists and deny lists

## Outbound treasury

- outbound flow can be controlled by same BitDAO multi-sig
- outbound can use allow lists and deny lists

## Pluggable and extensible

- lending mechanism
- insurance

## Treasury user stories

- asset buy backs
- liquidations
- buy now, pay later per asset
- buy now, pay later per treasury
