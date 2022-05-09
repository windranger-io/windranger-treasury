import {BaseContract, ContractReceipt} from 'ethers'
import {
    ActualAddBondEvent,
    addBondEventLogs,
    addBondEvents
} from './bond-curator-events'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'

export type ExpectedAddBondEvent = {bond: string; instigator: string}

/**
 * Verifies the content for an Add Bond event.
 */
export function verifyAddBondEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedAddBondEvent[]
): void {
    const actualEvents = addBondEvents(events('AddBond', receipt))

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectedAddBondEvent, actual: ActualAddBondEvent) =>
            deepEqualsAddBondEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected Add Bond events.
 */
export function verifyAddBondLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedAddBondEvent[]
): void {
    const actualEvents = addBondEventLogs(eventLog('AddBond', emitter, receipt))

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectedAddBondEvent, actual: ActualAddBondEvent) =>
            deepEqualsAddBondEvent(expected, actual)
    )
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
