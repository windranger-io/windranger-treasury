import {BaseContract, ContractReceipt} from 'ethers'
import {verifyOrderedEvents} from '../../framework/verify'
import {
    ActualDaoMetaDataUpdateEvent,
    ActualDaoTreasuryUpdateEvent,
    daoMetaDataUpdateEventLogs,
    daoMetaDataUpdateEvents,
    daoTreasuryUpdateEventLogs,
    daoTreasuryUpdateEvents
} from './dao-configuration-events'
import {parseEventLog, parseEvents} from '../../framework/events'

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
    const actualEvents = parseEvents(
        receipt,
        'DaoMetaDataUpdate',
        daoMetaDataUpdateEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsDaoMetaDataUpdateEvent
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
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'DaoMetaDataUpdate',
        daoMetaDataUpdateEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsDaoMetaDataUpdateEvent
    )
}

/**
 * Verifies the content for a Dao Treasury Update event.
 */
export function verifyDaoTreasuryUpdateEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedDaoTreasuryUpdateEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'DaoTreasuryUpdate',
        daoTreasuryUpdateEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsDaoTreasuryUpdateEvent
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
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'DaoTreasuryUpdate',
        daoTreasuryUpdateEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsDaoTreasuryUpdateEvent
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
