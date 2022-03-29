import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'
import {
    ActualSetDaoTreasuryEvent,
    setDaoTreasuryEventLogs,
    setDaoTreasuryEvents
} from './dao-bond-configuration-events'

export type ExpectedSetDaoTreasuryEvent = {
    daoId: bigint
    treasury: string
    instigator: string
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
