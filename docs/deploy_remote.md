# Remote contract deploy
Build, deploy and verify the contracts execute as expected to a remote RPC endpoint e.g. Pre-production or production.

## Deploy contracts
Contracts are best deployed using the deploy scripts.

### Deployment Environment
Set the following environment variables:
- `${TOKEN_SWEEP_BENEFICIARY}`: Address that will receive ERC20 tokens from any sweep performed.
- `${RPC_ENDPOINT_URL}`: The URL for the Web3 endpoint to use when deploying and accessing the contracts.
- `${DEPLOYER_PRIVATE_KEY}` : Private key for the account to use (and pay with) when deploying contracts.
- `${ETHERSCAN_API_KEY}` : API key to use when verifying the deployed contracts with Etherscan.

##### MacOS
Set the temporary environment variables by substituting `EnterYourAddressHere` with a valid Ethereum address (EoA or Contract).
```shell
export TOKEN_SWEEP_BENEFICIARY=${EnterYourAddressHere}
export RPC_ENDPOINT_URL=${EnterTheRpcEndpointHere}
export DEPLOYER_PRIVATE_KEY=[${EnterYourPrivateKeyHere}]
export ETHERSCAN_API_KEY=${EtherYourApiKey}
```

#### Performance Bonds and Staking Pool Deployment
```shell
npx hardhat run ./scripts/deploy/deploy-all.ts --network remote
```

#### Performance Bonds Deployment
```shell
npx hardhat run ./scripts/deploy/bond-deploy.ts --network remote
```

#### Staking Pool Deployment
```shell
npx hardhat run ./scripts/deploy/staking-pool-deploy.ts --network remote
```

#### Optional - BitDAO Token
_In production (Mainnet) existing ERC20 token contract should be used_

As verify scripts require a collateral token, for which the BIT token contract may be used.

```shell
npx hardhat run ./scripts/deploy/bitdao-deploy-no-etherscan.ts --network remote
```


#### Environment Variables needed for Verify

The terminal running the JSON-RPC node will output the contract addresses, these are needed for later:
- `${BondMediator}` : Performance Bond Mediator contract address.
- `${BondFactory}` : Performance Bond Factory contract address.
- `${StakingPoolMediator}` : Staking Pool Mediator contract address.
- `${StakingPoolFactory}` : Staking Pool Factory contract address.
- `${BitToken}` : Collateral token contract address (BIT).
- `${Treasury}` : Any valid address to use as the treasury.

## Verify contract behaviour
Check the contract deployment and operation with the test scripts.

### Performance Bonds
Before any Performance Bonds can be created, a number of setup steps are needed.

##### MacOS
Set the temporary environment variables by substituting the value running the lines in your terminal.
```shell
export BOND_MEDIATOR_CONTRACT=${BondMediator}
export BOND_FACTORY_CONTRACT=${BondFactory}
export COLLATERAL_TOKENS_CONTRACT=${BitToken}
export TREASURY_ADDRESS=${Treasury}
```

#### Create a DAO
All Performance Bond operations occur within the scope of a DAO.

The script creates a new DAO using `BOND_MEDIATOR_CONTRACT` and `TREASURY_ADDRESS`
```shell
npx hardhat run ./scripts/verify/create-bond-dao.ts --network remote
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
npx hardhat run ./scripts/verify/whitelist-bond-collateral.ts --network remote
```

#### Create a Performance Bond
A Performance Bond managed within the scope of a DAO.

The script creates a bond using the environment variables `BOND_MEDIATOR_CONTRACT`, `BOND_FACTORY_CONTRACT` and `DAO_ID`
```shell
npx hardhat run ./scripts/verify/create-managed-bond.ts --network remote
```

### Staking Pool
Before any Staking Pools can be created, a number of setup steps are needed.

##### MacOS
Set the temporary environment variables by substituting the value running the lines in your terminal.
```shell
export STAKING_POOL_MEDIATOR_ADDRESS=${StakingPoolMediator}
export STAKING_POOL_FACTORY_ADDRESS=${StakingPoolFactory}
export COLLATERAL_TOKENS_CONTRACT=${BitToken} 
export TREASURY_ADDRESS=${Treasury}
export DAO_METADATA=${DaoMetadata}
```

#### Create a DAO
All Staking Pool operations occur within the scope of a DAO.

The script creates a new DAO using `STAKING_POOL_MEDIATOR_ADDRESS` and `TREASURY_ADDRESS`
```shell
npx hardhat run ./scripts/verify/create-staking-pool-dao.ts --network remote
```

Note the `BigNumber` values from the `CreateDao` event, convert from hex to decimal and that is the DAO id.

#### MacOS
Set the temporary environment variables by substituting the value running the line in your terminal.
```shell
export DAO_ID=${DAO_ID}
```

#### Whitelist the collateral
Only whitelisted tokens are accepted as collateral.

The script whitelists the value of the environment variable `COLLATERAL_TOKENS_CONTRACT` with the `STAKING_POOL_MEDIATOR_ADDRESS`.
```shell
npx hardhat run ./scripts/verify/whitelist-staking-pool-collateral.ts --network remote
```

#### Create a Staking Pool
A Staking Pool managed within the scope of a DAO.

The script creates a staking pool using the environment variables `STAKING_POOL_MEDIATOR_ADDRESS`, `STAKING_POOL_FACTORY_ADDRESS` and `DAO_ID`
```shell
npx hardhat run ./scripts/verify/create-staking-pool.ts --network remote
```
