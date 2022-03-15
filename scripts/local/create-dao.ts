import {ethers} from 'hardhat'
import {BondMediator} from '../../typechain-types'
import {log} from '../../config/logging'
import {ContractReceipt, Event} from 'ethers'

async function createDao(mediatorAddress: string, treasuryAddress: string) {
    const factory = await ethers.getContractFactory('BondMediator')
    const contract = <BondMediator>factory.attach(mediatorAddress)

    log.info('Creating a new DAO')

    const transaction = await contract.createDao(treasuryAddress)

    const receipt = await transaction.wait()

    log.info('Transaction: ', receipt.transactionHash)

    const events = receiptEvents(receipt)

    for (const event of events) {
        log.info('%s, %s', event.event, JSON.stringify(event.args))
    }
}

async function main(): Promise<void> {
    const mediator = parseEnvironmentVariable('BOND_MEDIATOR_CONTRACT')
    const treasury = parseEnvironmentVariable('TREASURY_ADDRESS')

    // TODO validate input - addresses

    return createDao(mediator, treasury)
}

function receiptEvents(receipt: ContractReceipt): Event[] {
    const availableEvents = receipt.events
    return availableEvents ? availableEvents : []
}

function parseEnvironmentVariable(name: string): string {
    const envVar = process.env[name]

    log.info(envVar)

    // eslint-disable-next-line no-undefined
    if (envVar === undefined) {
        throw Error(`Missing environment variable: ${name}`)
    }

    return envVar
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
