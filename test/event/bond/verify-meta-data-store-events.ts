import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'
import {
    ActualSetMetaDataEvent,
    setMetaDataEventLogs,
    setMetaDataEvents
} from './meta-data-store-events'

export type ExpectedSetMetaDataEvent = {data: string; instigator: string}

/**
 * Verifies the content for a Set MetaData event.
 */
export function verifySetMetaDataEvents(
    receipt: ContractReceipt,
    metaData: ExpectedSetMetaDataEvent[]
): void {
    const actualEvents = setMetaDataEvents(events('SetMetaData', receipt))

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (actual: ActualSetMetaDataEvent, expected: ExpectedSetMetaDataEvent) =>
            deepEqualsSetMetaDataEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected Set MetaData events.
 */
export function verifySetMetaDataLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    metaData: ExpectedSetMetaDataEvent[]
): void {
    const actualEvents = setMetaDataEventLogs(
        eventLog('SetMetaData', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (actual: ActualSetMetaDataEvent, expected: ExpectedSetMetaDataEvent) =>
            deepEqualsSetMetaDataEvent(actual, expected)
    )
}

function deepEqualsSetMetaDataEvent(
    actual: ActualSetMetaDataEvent,
    expected: ExpectedSetMetaDataEvent
): boolean {
    return (
        actual.data === expected.data &&
        actual.instigator === expected.instigator
    )
}
