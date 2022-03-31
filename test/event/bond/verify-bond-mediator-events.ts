import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'
import {
    ActualBondCreatorUpdateEvent,
    bondCreatorUpdateEventLogs,
    bondCreatorUpdateEvents
} from './bond-mediator-events'

export type ExpectedBondCreatorUpdateEvent = {
    previousCreator: string
    updateCreator: string
    instigator: string
}

/**
 * Verifies the content for the Bond Creator Update event.
 */
export function verifyBondCreatorUpdateEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedBondCreatorUpdateEvent[]
): void {
    const actualEvents = bondCreatorUpdateEvents(
        events('BondCreatorUpdate', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualBondCreatorUpdateEvent,
            expected: ExpectedBondCreatorUpdateEvent
        ) => deepEqualsBondCreatorUpdateEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected Bond Creator Update events.
 */
export function verifyBondCreatorUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedBondCreatorUpdateEvent[]
): void {
    const actualEvents = bondCreatorUpdateEventLogs(
        eventLog('BondCreatorUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualBondCreatorUpdateEvent,
            expected: ExpectedBondCreatorUpdateEvent
        ) => deepEqualsBondCreatorUpdateEvent(actual, expected)
    )
}

function deepEqualsBondCreatorUpdateEvent(
    actual: ActualBondCreatorUpdateEvent,
    expected: ExpectedBondCreatorUpdateEvent
): boolean {
    return (
        actual.previousCreator === expected.previousCreator &&
        actual.updateCreator === expected.updateCreator &&
        actual.instigator === expected.instigator
    )
}
