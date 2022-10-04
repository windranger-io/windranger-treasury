import {ethers} from 'hardhat'
import {
    PerformanceBondMediator,
    StakingPoolMediator
} from '../../typechain-types'
import {log} from '../../config/logging'
import {logEvents} from '../utils/transaction-event-log'

export async function createDao(
    mediatorAddress: string,
    treasuryAddress: string,
    mediatorType: string,
    metadata: string
) {
    const factory = await ethers.getContractFactory(mediatorType)

    const contract = <PerformanceBondMediator | StakingPoolMediator>(
        factory.attach(mediatorAddress)
    )

    log.info('Creating a new DAO')

    const transaction = await contract.createDao(treasuryAddress, metadata)

    const receipt = await transaction.wait()

    log.info('Transaction complete with status %s', receipt.status)

    logEvents(receipt)
}
