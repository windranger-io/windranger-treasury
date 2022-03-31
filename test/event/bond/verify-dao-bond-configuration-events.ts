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
    metaData: ExpectedDaoMetaDataUpdateEvent[]
): void {
    const actualEvents = daoMetaDataUpdateEvents(
        events('DaoMetaDataUpdate', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (
            actual: ActualDaoMetaDataUpdateEvent,
            expected: ExpectedDaoMetaDataUpdateEvent
        ) => deepEqualsDaoMetaDataUpdateEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected Dao MetaData Update events.
 */
export function verifyDaoMetaDataUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    metaData: ExpectedDaoMetaDataUpdateEvent[]
): void {
    const actualEvents = daoMetaDataUpdateEventLogs(
        eventLog('DaoMetaDataUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (
            actual: ActualDaoMetaDataUpdateEvent,
            expected: ExpectedDaoMetaDataUpdateEvent
        ) => deepEqualsDaoMetaDataUpdateEvent(actual, expected)
    )
}

/**
 * Verifies the content for a Dao Treasury Update event.
 */
export function verifyDaoTreasuryUpdateEvents(
    receipt: ContractReceipt,
    metaData: ExpectedDaoTreasuryUpdateEvent[]
): void {
    const actualEvents = daoTreasuryUpdateEvents(
        events('DaoTreasuryUpdate', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (
            actual: ActualDaoTreasuryUpdateEvent,
            expected: ExpectedDaoTreasuryUpdateEvent
        ) => deepEqualsDaoTreasuryUpdateEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected Dao Treasury Update events.
 */
export function verifyDaoTreasuryUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    metaData: ExpectedDaoTreasuryUpdateEvent[]
): void {
    const actualEvents = daoTreasuryUpdateEventLogs(
        eventLog('DaoTreasuryUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (
            actual: ActualDaoTreasuryUpdateEvent,
            expected: ExpectedDaoTreasuryUpdateEvent
        ) => deepEqualsDaoTreasuryUpdateEvent(actual, expected)
    )
}

function deepEqualsDaoMetaDataUpdateEvent(
    actual: ActualDaoMetaDataUpdateEvent,
    expected: ExpectedDaoMetaDataUpdateEvent
): boolean {
    return (
        actual.daoId.toBigInt() === expected.daoId &&
        actual.data === expected.data &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsDaoTreasuryUpdateEvent(
    actual: ActualDaoTreasuryUpdateEvent,
    expected: ExpectedDaoTreasuryUpdateEvent
): boolean {
    return (
        actual.daoId.toBigInt() === expected.daoId &&
        actual.treasury === expected.treasury &&
        actual.instigator === expected.instigator
    )
}
