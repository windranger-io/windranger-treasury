# Solidity Architecture

----
WIP

---

### Pool of funds under control (vault)
Must concurrently support dealing in variety of assets
- ETH, native coin
- ERC-20
- NFTs
- ZK proofs (with their associated EIP-712 encoded API) ????? invesitgate further

### Deposit / Funding mechanism
Initially support go get funds as needed (request) or be given them (deposit)

### Withdrawal mechanism
Initially support send funds or redeem funds.
Support overdraw facility

## Nouns
- Comtroller: responsible for supervising the quality of financial reporting of an organization.
- Treasury: a place in which treasure is kept / A place in which private or public funds are received, kept, managed, and disbursed.
- Vault: a room or compartment for the safekeeping of valuables
- Accounts receivable: monies due, not yet received. Accounts receivables are listed on the balance sheet as a current asset.
- Accounts payable: an account within the general ledger that represents an obligation to pay off a debt.

## Verbs (transitive)
Deposit: something placed for safekeeping: such as in a bank
Withdraw: to remove (money) from a place of deposit

## Thinking out loud
An entity is needed to orchestrate the funds, funding and withdrawl mechanisms. Throw into there the access/security and events needed for auditing. [treasury || comptroller]

All the monies need to be stored somewhere [vault || treasury]

As deposits event represents funds making their way into the treasury, independent of whether it was a deposit or redemption.

A withdrawal is likewise an event that is independent of whether it is a treaury driven or redemption model.

Event (deposit / withdraw) will need to know their context, the asset being added or removed.

The outgoing need to keep a log for 30 days of upcoming expenses.

Incoming (accounts receivable), when the treasury pulls funds from another source, if not already settled via deposit (optional config). Would need a tick to trigger the collection, could be module to decide action: log, log & retrieve,etc



## Open Questions
- Who to pay the network fees on withdrawal? (pull model would shift, like a collection model could too)

- What value is there in the Vault abstraction?

- Where should flow control reside, at the 

- As dealing with ETH requires specific methods and keywords, are separate vaults warranted or merely extra hassle?

- Do we want a multi-sig or backup account with access to withdraw fund, for backup?

