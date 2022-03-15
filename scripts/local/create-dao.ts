import {ethers} from 'hardhat'
import {BondMediator} from '../../typechain-types'
import {log} from '../../config/logging'
import {addressEnvironmentVariable} from '../utils/environment-variable'
import {logEvents} from '../utils/transaction-event-log'

async function createDao(mediatorAddress: string, treasuryAddress: string) {
    const factory = await ethers.getContractFactory('BondMediator')
    const contract = <BondMediator>factory.attach(mediatorAddress)

    log.info('Creating a new DAO')

    const transaction = await contract.createDao(treasuryAddress)

    const receipt = await transaction.wait()

    log.info('Transaction complete with status %s', receipt.status)

    logEvents(receipt)
}

async function main(): Promise<void> {
    const mediator = addressEnvironmentVariable('BOND_MEDIATOR_CONTRACT')
    const treasury = addressEnvironmentVariable('TREASURY_ADDRESS')

    return createDao(mediator, treasury)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
