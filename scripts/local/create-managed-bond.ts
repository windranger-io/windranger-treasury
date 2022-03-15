import {ethers} from 'hardhat'
import {BondFactory, BondMediator} from '../../typechain-types'
import {log} from '../../config/logging'
import {
    addressEnvironmentVariable,
    bigintEnvironmentVariable
} from '../utils/environment-variable'
import {logCreateBondEvents} from '../utils/transaction-event-log'

async function createManagedBond(
    mediatorAddress: string,
    creatorAddress: string,
    daoId: bigint,
    collateralTokensAddress: string
): Promise<void> {
    const mediatorFactory = await ethers.getContractFactory('BondMediator')
    const mediator = <BondMediator>mediatorFactory.attach(mediatorAddress)

    const creatorFactory = await ethers.getContractFactory('BondFactory')
    const creator = <BondFactory>creatorFactory.attach(creatorAddress)

    log.info('Creating a new managed bond')

    const transaction = await mediator.createManagedBond(
        BigInt(daoId),
        {
            name: 'Name for testing',
            symbol: 'TEST001',
            data: ''
        },
        {
            debtTokenAmount: 75000n,
            collateralTokens: collateralTokensAddress,
            expiryTimestamp: 1640010122n,
            minimumDeposit: 25n
        }
    )

    const receipt = await transaction.wait()

    log.info('Transaction complete with status %s', receipt.status)

    logCreateBondEvents(creator, receipt)
}

async function main(): Promise<void> {
    const creator = addressEnvironmentVariable('BOND_FACTORY_CONTRACT')
    const mediator = addressEnvironmentVariable('BOND_MEDIATOR_CONTRACT')
    const collateral = addressEnvironmentVariable('COLLATERAL_TOKENS_CONTRACT')
    const daoId = bigintEnvironmentVariable('DAO_ID')

    return createManagedBond(mediator, creator, daoId, collateral)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
