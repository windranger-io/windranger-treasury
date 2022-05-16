import {BaseContract, ContractReceipt} from 'ethers'
import {verifyOrderedEvents} from '../../framework/verify'
import {
    ActualMetaDataUpdateEvent,
    metaDataUpdateEventLogs,
    metaDataUpdateEvents
} from './meta-data-store-events'
import {parseEventLog, parseEvents} from '../../framework/events'

export type ExpectedMetaDataUpdateEvent = {data: string; instigator: string}

/**
 * Verifies the content for a MetaDataUpdate event.
 */
export function verifyMetaDataUpdateEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedMetaDataUpdateEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'MetaDataUpdate',
        metaDataUpdateEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsMetaDataUpdateEvent
    )
}

/**
 * Verifies the event log entries contain the expected MetaDataUpdate events.
 */
export function verifyMetaDataUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedMetaDataUpdateEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'MetaDataUpdate',
        metaDataUpdateEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsMetaDataUpdateEvent
    )
}

function deepEqualsMetaDataUpdateEvent(
    expected: ExpectedMetaDataUpdateEvent,
    actual: ActualMetaDataUpdateEvent
): boolean {
    return (
        actual.data === expected.data &&
        actual.instigator === expected.instigator
    )
}
