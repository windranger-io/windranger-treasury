import {BaseContract, ContractReceipt} from 'ethers'
import {verifyOrderedEvents} from '../../framework/verify'
import {
    ActualRedeemableUpdateEvent,
    redeemableUpdateEventLogs,
    redeemableUpdateEvents
} from './redeemable-events'
import {parseEventLog, parseEvents} from '../../framework/events'

export type ExpectedRedeemableUpdateEvent = {
    isRedeemable: boolean
    reason: string
    instigator: string
}

/**
 * Verifies the content for a Redeemable Update event.
 */
export function verifyRedeemableEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedRedeemableUpdateEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'RedeemableUpdate',
        redeemableUpdateEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsRedeemableUpdateEvent
    )
}

/**
 * Verifies the event log entries contain the expected Redeemable Update events.
 */
export function verifyRedeemableUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedRedeemableUpdateEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'RedeemableUpdate',
        redeemableUpdateEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsRedeemableUpdateEvent
    )
}

function deepEqualsRedeemableUpdateEvent(
    expected: ExpectedRedeemableUpdateEvent,
    actual: ActualRedeemableUpdateEvent
): boolean {
    return (
        actual.isRedeemable === expected.isRedeemable &&
        actual.reason === expected.reason &&
        actual.instigator === expected.instigator
    )
}
