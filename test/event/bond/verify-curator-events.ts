import {BaseContract, ContractReceipt} from 'ethers'
import {
    ActualAddBondEvent,
    addBondEventLogs,
    addBondEvents
} from './bond-curator-events'
import {
    parseEventLog,
    parseEvents,
    verifyOrderedEvents
} from '../../framework/verify'

export type ExpectedAddBondEvent = {bond: string; instigator: string}

/**
 * Verifies the content for an Add Bond event.
 */
export function verifyAddBondEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedAddBondEvent[]
): void {
    const actualEvents = parseEvents(receipt, 'AddBond', addBondEvents)

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsAddBondEvent)
}

/**
 * Verifies the event log entries contain the expected Add Bond events.
 */
export function verifyAddBondLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedAddBondEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'AddBond',
        addBondEventLogs
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsAddBondEvent)
}

function deepEqualsAddBondEvent(
    expected: ExpectedAddBondEvent,
    actual: ActualAddBondEvent
): boolean {
    return (
        actual.bond === expected.bond &&
        actual.instigator === expected.instigator
    )
}
