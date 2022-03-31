# Local contract deploy
Run a local JSON-RPC node, build, deploy and verify the contracts execute
as expected.

## Start a node
Start a local JSON-RPC node with Hardhat.
```shell
npx hardhat node
```

## Deploy contracts
Contracts are best deployed to a local Hardhat JSON-RPC node with scripts.

### Local Environment 
A JSON-RPC node running locally, with no Etherscan service available.

The following environment variables:
- `${TOKEN_SWEEP_BENEFICIARY}`: Address that will receive ERC20 tokens from any sweep performed.

##### MacOs
Set the temporary environment variables by substituting `EnterYourAddressHere` with a valid Ethereum address (EoA or Contract).
```shell
export TOKEN_SWEEP_BENEFICIARY=${EnterYourAddressHere}
```

#### Performance Bonds
```shell
npx hardhat run ./scripts/deploy/deploy-all-no-etherscan.ts --network localhost
```
The terminal running the JSON-RPC node will output the contract addresses, these are needed for later:
- `${BondMediator}` : Bond Mediator contract address. 
- `${BondFactory}` : Bond Factory contract address.
- `${BitToken}` : Collateral token contract address (BIT).
- `${Treausy}` : Any valid address to use as the treasury.

### Integration Environment onwards
Any environment with an Etherscan service available, which should the case for at least pre-production and production.

#### Performance Bonds
```shell
npx hardhat run ./scripts/deploy/deploy-all.ts --network rinkeby
```

## Verify contract behaviour
Check the contract deployment and operation with the test scripts.

### Performance Bonds
Before any Bonds can be created, a number of setup steps are needed.

##### MacOS
Set the temporary environment variables by substituting the value running the lines in your terminal.
```shell
export BOND_MEDIATOR_CONTRACT=${BondMediator}
export BOND_FACTORY_CONTRACT=${BondFactory}
export COLLATERAL_TOKENS_CONTRACT=${BitToken}
export TREASURY_ADDRESS=${Treausy}
```

#### Create a DAO
All Bond operations occur within the scope of a DAO.

The script creates a new DAO using `BOND_MEDIATOR_CONTRACT` and `TREASURY_ADDRESS`
```shell
npx hardhat run ./scripts/verify/create-dao.ts --network localhost
```

Note the `BigNumber` values from the `CreateDao` event, convert from hex to decimal and that is the DAO id.

#### MacOS
Set the temporary environment variables by substituting the value running the line in your terminal.
```shell
export DAO_ID=${DAO_ID}
```

#### Whitelist the collateral
Only whitelisted tokens are accepted as collateral.

The script whitelists the value of the environment variable `COLLATERAL_TOKENS_CONTRACT` with the `BOND_MEDIATOR_CONTRACT`.
```shell
npx hardhat run ./scripts/verify/whitelist-collateral.ts --network localhost
```

#### Create a Bond
A Bond managed within the scope of a DAO.

The script creates a bond using the environment variables `BOND_MEDIATOR_CONTRACT`, `BOND_FACTORY_CONTRACT` and `DAO_ID`
```shell
npx hardhat run ./scripts/verify/create-managed-bond.ts --network localhost
```
