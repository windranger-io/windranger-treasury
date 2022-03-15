import {ethers} from 'hardhat'
import {BondMediator} from '../../typechain-types'
import {log} from '../../config/logging'
import {ContractReceipt, Event} from 'ethers'
import {
    addressEnvironmentVariable,
    bigintEnvironmentVariable
} from '../utils/environment-variable'

async function createManagedBond(
    mediatorAddress: string,
    daoId: bigint,
    collateralTokensAddress: string
): Promise<void> {
    const factory = await ethers.getContractFactory('BondMediator')
    const contract = <BondMediator>factory.attach(mediatorAddress)

    log.info('Creating a new managed bond')

    const transaction = await contract.createManagedBond(
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

    log.info('Transaction: ', receipt.transactionHash)

    const events = receiptEvents(receipt)

    for (const event of events) {
        log.info('%s, %s', event.event, JSON.stringify(event.args))
    }
}

async function main(): Promise<void> {
    const mediator = addressEnvironmentVariable('BOND_MEDIATOR_CONTRACT')
    const collateral = addressEnvironmentVariable('COLLATERAL_TOKENS_CONTRACT')
    const daoId = bigintEnvironmentVariable('DAO_ID')

    return createManagedBond(mediator, daoId, collateral)
}

function receiptEvents(receipt: ContractReceipt): Event[] {
    const availableEvents = receipt.events
    return availableEvents ? availableEvents : []
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
