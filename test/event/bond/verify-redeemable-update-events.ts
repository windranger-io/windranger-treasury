import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'
import {
    ActualRedeemableUpdateEvent,
    redeemableUpdateEventLogs,
    redeemableUpdateEvents
} from './redeemable-update-events'

export type ExpectedRedeemableUpdateEvent = {
    isRedeemable: boolean
    reason: string
    instigator: string
}

/**
 * Verifies the content for a Redeemable event.
 */
export function verifyRedeemableUpdateEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedRedeemableUpdateEvent[]
): void {
    const actualEvents = redeemableUpdateEvents(
        events('RedeemableUpdate', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualRedeemableUpdateEvent,
            expected: ExpectedRedeemableUpdateEvent
        ) => deepEqualsRedeemableUpdateEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected Redeemable events.
 */
export function verifyRedeemableUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedRedeemableUpdateEvent[]
): void {
    const actualEvents = redeemableUpdateEventLogs(
        eventLog('RedeemableUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualRedeemableUpdateEvent,
            expected: ExpectedRedeemableUpdateEvent
        ) => deepEqualsRedeemableUpdateEvent(actual, expected)
    )
}

function deepEqualsRedeemableUpdateEvent(
    actual: ActualRedeemableUpdateEvent,
    expected: ExpectedRedeemableUpdateEvent
): boolean {
    return (
        actual.isRedeemable === expected.isRedeemable &&
        actual.reason === expected.reason &&
        actual.instigator === expected.instigator
    )
}
