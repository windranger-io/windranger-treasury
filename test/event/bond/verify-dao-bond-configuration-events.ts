import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'
import {
    ActualSetDaoMetaDataEvent,
    ActualSetDaoTreasuryEvent,
    setDaoMetaDataEventLogs,
    setDaoMetaDataEvents,
    setDaoTreasuryEventLogs,
    setDaoTreasuryEvents
} from './dao-bond-configuration-events'

export type ExpectedSetDaoTreasuryEvent = {
    daoId: bigint
    treasury: string
    instigator: string
}

export type ExpectedSetDaoMetaDataEvent = {
    daoId: bigint
    data: string
    instigator: string
}

/**
 * Verifies the content for a Set Dao MetaData event.
 */
export function verifySetDaoMetaDataEvents(
    receipt: ContractReceipt,
    metaData: ExpectedSetDaoMetaDataEvent[]
): void {
    const actualEvents = setDaoMetaDataEvents(events('SetMetaData', receipt))

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (
            actual: ActualSetDaoMetaDataEvent,
            expected: ExpectedSetDaoMetaDataEvent
        ) => deepEqualsSetDaoMetaDataEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected Set Dao MetaData events.
 */
export function verifySetDaoMetaDataLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    metaData: ExpectedSetDaoMetaDataEvent[]
): void {
    const actualEvents = setDaoMetaDataEventLogs(
        eventLog('SetMetaData', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (
            actual: ActualSetDaoMetaDataEvent,
            expected: ExpectedSetDaoMetaDataEvent
        ) => deepEqualsSetDaoMetaDataEvent(actual, expected)
    )
}

/**
 * Verifies the content for a Set Dao Treasury event.
 */
export function verifySetDaoTreasuryEvents(
    receipt: ContractReceipt,
    metaData: ExpectedSetDaoTreasuryEvent[]
): void {
    const actualEvents = setDaoTreasuryEvents(events('SetDaoTreasury', receipt))

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (
            actual: ActualSetDaoTreasuryEvent,
            expected: ExpectedSetDaoTreasuryEvent
        ) => deepEqualsSetDaoTreasuryEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected Set Dao Treasury events.
 */
export function verifySetDaoTreasuryLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    metaData: ExpectedSetDaoTreasuryEvent[]
): void {
    const actualEvents = setDaoTreasuryEventLogs(
        eventLog('SetDaoTreasury', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        metaData,
        (
            actual: ActualSetDaoTreasuryEvent,
            expected: ExpectedSetDaoTreasuryEvent
        ) => deepEqualsSetDaoTreasuryEvent(actual, expected)
    )
}

function deepEqualsSetDaoMetaDataEvent(
    actual: ActualSetDaoMetaDataEvent,
    expected: ExpectedSetDaoMetaDataEvent
): boolean {
    return (
        actual.daoId.toBigInt() === expected.daoId &&
        actual.data === expected.data &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsSetDaoTreasuryEvent(
    actual: ActualSetDaoTreasuryEvent,
    expected: ExpectedSetDaoTreasuryEvent
): boolean {
    return (
        actual.daoId.toBigInt() === expected.daoId &&
        actual.treasury === expected.treasury &&
        actual.instigator === expected.instigator
    )
}
