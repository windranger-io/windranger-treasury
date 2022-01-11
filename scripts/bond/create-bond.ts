import {ethers, run} from 'hardhat'
import {BondMediator} from '../../typechain'
import {log} from '../../config/logging'
import {ContractReceipt, Event} from 'ethers'

const BOND_MEDIATOR_ADDRESS = '0x5023cC786D6596C405a98a956384012117d11118'

async function main() {
    await run('compile')

    const factory = await ethers.getContractFactory('BondMediator')
    const contract = <BondMediator>factory.attach(BOND_MEDIATOR_ADDRESS)

    log.info('Creating a new managed bond')

    const transaction = await contract.createManagedBond(
        '  Name for testing',
        'TEST001',
        75000n,
        'BIT',
        1640010122n,
        25n,
        ''
    )

    const receipt = await transaction.wait()

    log.info('Transaction: ', receipt.transactionHash)

    const events = receiptEvents(receipt)

    for (const event of events) {
        log.info('%s, %s', event.event, JSON.stringify(event.args))
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })

function receiptEvents(receipt: ContractReceipt): Event[] {
    const availableEvents = receipt.events
    return availableEvents ? availableEvents : []
}
