import {ContractReceipt, Event} from 'ethers'
import {createBondEventLogs} from '../../test/event/bond/bond-creator-events'
import {eventLog} from '../../test/framework/event-logs'
import {log} from '../../config/logging'
import {BondFactory} from '../../typechain-types'

function receiptEvents(receipt: ContractReceipt): Event[] {
    const availableEvents = receipt.events
    return availableEvents ? availableEvents : []
}

export function logEvents(receipt: ContractReceipt): void {
    const events = receiptEvents(receipt)

    for (const event of events) {
        log.info('%s, %s', event.event, JSON.stringify(event.args))
    }
}

export function logCreateBondEvents(
    emitter: BondFactory,
    receipt: ContractReceipt
): void {
    const createBondEvents = createBondEventLogs(
        eventLog('CreateBond', emitter, receipt)
    )

    for (const event of createBondEvents) {
        log.info('CreateBond event: %s', JSON.stringify(event))
    }
}
