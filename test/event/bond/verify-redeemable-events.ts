import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'
import {
    ActualRedeemableEvent,
    redeemableEventLogs,
    redeemableEvents
} from './redeemable-events'

export type ExpectedRedeemableEvent = {instigator: string}

/**
 * Verifies the content for a Redeemable event.
 */
export function verifyRedeemableEvents(
    receipt: ContractReceipt,
    metaData: ExpectedRedeemableEvent[]
): void {
    const actualEvents = redeemableEvents(events('Redeemable', receipt))

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (actual: ActualRedeemableEvent, expected: ExpectedRedeemableEvent) =>
            deepEqualsRedeemableEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected Redeemable events.
 */
export function verifyRedeemableLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    metaData: ExpectedRedeemableEvent[]
): void {
    const actualEvents = redeemableEventLogs(
        eventLog('Redeemable', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (actual: ActualRedeemableEvent, expected: ExpectedRedeemableEvent) =>
            deepEqualsRedeemableEvent(actual, expected)
    )
}

function deepEqualsRedeemableEvent(
    actual: ActualRedeemableEvent,
    expected: ExpectedRedeemableEvent
): boolean {
    return actual.instigator === expected.instigator
}
