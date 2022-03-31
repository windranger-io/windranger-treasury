import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'
import {
    ActualMetaDataUpdateEvent,
    metaDataUpdateEventLogs,
    metaDataUpdateEvents
} from './meta-data-store-events'

export type ExpectedMetaDataUpdateEvent = {data: string; instigator: string}

/**
 * Verifies the content for a MetaDataUpdate event.
 */
export function verifyMetaDataUpdateEvents(
    receipt: ContractReceipt,
    metaData: ExpectedMetaDataUpdateEvent[]
): void {
    const actualEvents = metaDataUpdateEvents(events('MetaDataUpdate', receipt))

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (
            actual: ActualMetaDataUpdateEvent,
            expected: ExpectedMetaDataUpdateEvent
        ) => deepEqualsMetaDataUpdateEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected MetaDataUpdate events.
 */
export function verifyMetaDataUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    metaData: ExpectedMetaDataUpdateEvent[]
): void {
    const actualEvents = metaDataUpdateEventLogs(
        eventLog('MetaDataUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (
            actual: ActualMetaDataUpdateEvent,
            expected: ExpectedMetaDataUpdateEvent
        ) => deepEqualsMetaDataUpdateEvent(actual, expected)
    )
}

function deepEqualsMetaDataUpdateEvent(
    actual: ActualMetaDataUpdateEvent,
    expected: ExpectedMetaDataUpdateEvent
): boolean {
    return (
        actual.data === expected.data &&
        actual.instigator === expected.instigator
    )
}
