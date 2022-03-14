import {BondMediator} from '../../typechain-types'
import {log} from '../../config/logging'
import {ContractReceipt, Event} from 'ethers'
import {HardhatEthersHelpers} from '@nomiclabs/hardhat-ethers/types'

export async function createBond(
    mediatorAddress: string,
    daoId: string,
    ethers: HardhatEthersHelpers
) {
    const factory = await ethers.getContractFactory('BondMediator')
    const contract = <BondMediator>factory.attach(mediatorAddress)

    const network = await ethers.provider.getNetwork()
    log.info(network)

    log.info(mediatorAddress)

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
            collateralTokens: 'BIT',
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

function receiptEvents(receipt: ContractReceipt): Event[] {
    const availableEvents = receipt.events
    return availableEvents ? availableEvents : []
}
