import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'
import {
    ActualDaoMetaDataUpdateEvent,
    ActualDaoTreasuryUpdateEvent,
    daoMetaDataUpdateEventLogs,
    daoMetaDataUpdateEvents,
    daoTreasuryUpdateEventLogs,
    daoTreasuryUpdateEvents
} from './dao-bond-configuration-events'

export type ExpectedDaoTreasuryUpdateEvent = {
    daoId: bigint
    treasury: string
    instigator: string
}

export type ExpectedDaoMetaDataUpdateEvent = {
    daoId: bigint
    data: string
    instigator: string
}

/**
 * Verifies the content for a Dao MetaData Update event.
 */
export function verifyDaoMetaDataUpdateEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedDaoMetaDataUpdateEvent[]
): void {
    const actualEvents = daoMetaDataUpdateEvents(
        events('DaoMetaDataUpdate', receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectedDaoMetaDataUpdateEvent,
            actual: ActualDaoMetaDataUpdateEvent
        ) => deepEqualsDaoMetaDataUpdateEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected Dao MetaData Update events.
 */
export function verifyDaoMetaDataUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedDaoMetaDataUpdateEvent[]
): void {
    const actualEvents = daoMetaDataUpdateEventLogs(
        eventLog('DaoMetaDataUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectedDaoMetaDataUpdateEvent,
            actual: ActualDaoMetaDataUpdateEvent
        ) => deepEqualsDaoMetaDataUpdateEvent(expected, actual)
    )
}

/**
 * Verifies the content for a Dao Treasury Update event.
 */
export function verifyDaoTreasuryUpdateEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedDaoTreasuryUpdateEvent[]
): void {
    const actualEvents = daoTreasuryUpdateEvents(
        events('DaoTreasuryUpdate', receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectedDaoTreasuryUpdateEvent,
            actual: ActualDaoTreasuryUpdateEvent
        ) => deepEqualsDaoTreasuryUpdateEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected Dao Treasury Update events.
 */
export function verifyDaoTreasuryUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedDaoTreasuryUpdateEvent[]
): void {
    const actualEvents = daoTreasuryUpdateEventLogs(
        eventLog('DaoTreasuryUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectedDaoTreasuryUpdateEvent,
            actual: ActualDaoTreasuryUpdateEvent
        ) => deepEqualsDaoTreasuryUpdateEvent(expected, actual)
    )
}

function deepEqualsDaoMetaDataUpdateEvent(
    expected: ExpectedDaoMetaDataUpdateEvent,
    actual: ActualDaoMetaDataUpdateEvent
): boolean {
    return (
        actual.daoId.toBigInt() === expected.daoId &&
        actual.data === expected.data &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsDaoTreasuryUpdateEvent(
    expected: ExpectedDaoTreasuryUpdateEvent,
    actual: ActualDaoTreasuryUpdateEvent
): boolean {
    return (
        actual.daoId.toBigInt() === expected.daoId &&
        actual.treasury === expected.treasury &&
        actual.instigator === expected.instigator
    )
}
