import {BondMediator} from '../../typechain-types'
import {log} from '../../config/logging'
import {ContractReceipt, Event} from 'ethers'
import {HardhatEthersHelpers} from '@nomiclabs/hardhat-ethers/types'

export async function createDao(
    mediatorAddress: string,
    treasuryAddress: string,
    ethers: HardhatEthersHelpers
) {
    log.info(mediatorAddress)

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

function receiptEvents(receipt: ContractReceipt): Event[] {
    const availableEvents = receipt.events
    return availableEvents ? availableEvents : []
}
