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

### Performance Bonds

```shell
npx hardhat run ./scripts/deploy/bond-deploy.ts --network localhost
```
The terminal running the JSON-RPC node will output the contract addresses, 
make a note of these as you'll need them for the tests.

## Verify contracts
Check the contract deployment and operation with the test scripts.

### Performance Bonds

Output roles for only user


#### Create a DAO
All Bond operations occur within the context of a DAO.

Replace these variable:
- `${TREASURY_ADDRESS}` : None zero address, default DAO Treasury.
- `${MEDIATOR_CONTRACT_ADDRESS}` : BondMediator contract (from the deployment step).

```shell
npx hardhat run ./scripts/local/create-dao.ts --network localhost
```

Note the `BigNumber` values from the `CreateDao` event, convert from hex to decimal and that is the DAO id to use later.

#### Create a Bond


