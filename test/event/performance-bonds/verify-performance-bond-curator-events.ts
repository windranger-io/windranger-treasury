import {BaseContract, ContractReceipt} from 'ethers'
import {
    ActualAddPerformanceBondEvent,
    addPerformanceBondEventLogs,
    addPerformanceBondEvents
} from './performance-bond-curator-events'
import {verifyOrderedEvents} from '../../framework/verify'
import {parseEventLog, parseEvents} from '../../framework/events'

export type ExpectedAddBondEvent = {bond: string; instigator: string}

/**
 * Verifies the content for an Add Performance Bond event.
 */
export function verifyAddPerformanceBondEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedAddBondEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'AddPerformanceBond',
        addPerformanceBondEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsAddPerformanceBondEvent
    )
}

/**
 * Verifies the event log entries contain the expected Add Performance Bond events.
 */
export function verifyAddPerformanceBondLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedAddBondEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'AddPerformanceBond',
        addPerformanceBondEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsAddPerformanceBondEvent
    )
}

function deepEqualsAddPerformanceBondEvent(
    expected: ExpectedAddBondEvent,
    actual: ActualAddPerformanceBondEvent
): boolean {
    return (
        actual.bond === expected.bond &&
        actual.instigator === expected.instigator
    )
}
