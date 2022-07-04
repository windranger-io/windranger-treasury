# Windranger Treasury

Inbound and outbound treasury

## Development Process

Development follows these processes outlined in [development process](docs/development_process.md)

## Setup

### Install

To retrieve the project dependencies and before any further tasks will run correctly

```shell
npm ci
```

#### Husky Git Commit Hooks

To enable Husky commit hooks to trigger the lint-staged behaviour of formatting and linting the staged files prior
before committing, prepare your repo with `prepare`.

```shell
npm run prepare
```

#### Build and Test

```shell
npm run build
npm test
```

If you make changes that don't get picked up then add a clean into the process

```shell
npm run clean
npm run build
npm test
```

### Hardhat

If you want to avoid using the convience scripts, then you can execute against Hardhat directly.

#### All tests

Target to run all the mocha tests found in the `/test` directory, transpiled as necessary.

```shell
npx hardhat test
```

#### Single test

Run a single test (or a regex of tests), then pass in as an argument.

```shell
 npx hardhat test .\test\sample.test.ts
```

#### Scripts

The TypeScript transpiler will automatically as needed, execute through HardHat for the instantiated environment

```shell
npx hardhat run .\scripts\bond-deploy.ts
```

### Logging

Logging is performed with Bunyan

#### Bunyan CLI

To have the JSON logging output into a more human-readable form, pipe the stdout to the Bunyan CLI tool.

```shell
npx hardhat accounts | npx bunyan
```

## Deploy & Test contracts locally

The contracts can be deployed locally and their behaviour verified using our [local deploy scripts](./docs/deploy_local.md)

## Deploy & Test contracts on a RPC endpoint

The contracts can be deployed locally and their behaviour verified using our [remote deploy scripts](./docs/deploy_remote.md)

## Solidity Static Analysis

We use the Trail of Bits Solidity static analyzer [Slither](https://github.com/crytic/slither).

### Local

#### Install

With Python 3 in your environment, install using the Python package manager `pip3`:

```shell
pip3 install slither-analyzer
```

#### Run

When at the project root, to run and exclude `BitDao.sol`, anything containing the path `contracts\treasury` or `node_modules`:

```shell
slither . --filter-paths "BitDAO.sol|contracts/treasury|node_modules"
```

Alternatively to run using a `slither.json` config file:

```shell
slither . --config-file slither.json
```

### Docker

The Trail of Bits toolbox image contains a number of applications (including Slither).

#### Install

With Docker in your environment, install the image from DockerHub:

```shell
docker pull trailofbits/eth-security-toolbox
```

#### Run

To start a new container with your local source mounted/accessible within the container:
(replacing <ABSOLUTE_PATH_TO_WORKING_DIRECTORY> with the absolute path to the project working directory)

```shell
docker run -it --mount type=bind,source=<ABSOLUTE_PATH_TO_WORKING_DIRECTORY>,destination=/home/ethsec/test-me trailofbits/eth-security-toolbox
```

The container will automatically start and log you in, with the project code located in `test-me`.
Navigate into the `test-me` directory and run the static analysis:

```shell
cd test-me
slither . --filter-paths "BitDAO.sol|contracts/treasury|node_modules"
```

Alternatively to run using a `slither.json` config file:

```shell
cd test-me
slither . --config-file slither.json
```

## Tools

### Contract sizing

The size of all contract can be display in a table using a custom task that runs under `yarn`

```shell
yarn run hardhat size-contracts
```

### Solidity Documentation Generation

Markdown files can be generated from the Solidity files

```shell
npx hardhat docgen
```

The output mirrors the Solidity file structure and will be found at `./solidity-docs`.
