# Bond Specification (Single)

Specification for a bond contract that caters for a single bond, debt token and security token.

## Sequence Diagram

[Bond life-cycle](./bonding.puml)

## Assets

The bond will manage a pool of ERC20 debt certificates and hold an asset for security (Security Asset).

### Debt Certificate

The supply of Debt Certificates will be created in the same transaction that creates the bond, however there must be the ability for the Owner to increase the supply (mint).

_(Increasing the supply of Debt Certificates is expected to be an infrequent occurrence)_

The Bond needs to cater for addresses receiving and sending the Debt Certificates being of any type (i.e. simple wallet, multi-sig wallet or contract).

Each Debt Certificate must be a ERC20 token, which may be transferred directly independently of any functions of the bond (e.g. exchange trading / derivatives)

Every Bond must have it's own ERC20 token, for the single Bond contract there is no direct pooling support required.

### Security Asset

The Security Asset can be any ERC20 assets, with support needed for those that implement the non-standard `decreaseAllowance` and `increaseAllowance` functions.

The addresses involved in Security Asset transfers may be of any type (i.e. simple wallet, multi-sig wallet or contract).

There is an edge case of direct transfer of the Security Asset to the Bond contract address, this occurrence must not affect Bond behaviour (i.e. deposit, slash, redemm ).
