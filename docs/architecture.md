# Solidity Architecture

Each of the native currency or token has a abstract implementation of a vault that the Treasury extends (Solidity multiple inheritance, separating ecah concern into it's own parent).

There is a strategy for depositing and withdrawing for each of the classes of asset.
The granularity for each strategy would depend on the type. ETH would be a singleton, while ERC20 a mapping of token to strategy and ERC721 perhaps something else again.

Limitation from dividing strategies is difficulty if wanting a variable mix of assets e.g withdraw 100ETH of BIT or USDT in any ratio.

### Bonding

When guarantors bond a security as collateral, they use a Bond:

- [Bond (Single)](./specs/bond_single.md)
