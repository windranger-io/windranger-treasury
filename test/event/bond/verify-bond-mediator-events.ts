import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'
import {
    ActualBondCreatorUpdateEvent,
    ActualCreateDaoEvent,
    bondCreatorUpdateEventLogs,
    bondCreatorUpdateEvents,
    createDaoEventLogs,
    createDaoEvents
} from './bond-mediator-events'

export type ExpectBondCreatorUpdateEvent = {
    previousCreator: string
    updateCreator: string
    instigator: string
}

export type ExpectCreateDaoEvent = {
    id: bigint
    treasury: string
    instigator: string
}

/**
 * Verifies the content for the Bond Creator Update event.
 */
export function verifyBondCreatorUpdateEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectBondCreatorUpdateEvent[]
): void {
    const actualEvents = bondCreatorUpdateEvents(
        events('BondCreatorUpdate', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualBondCreatorUpdateEvent,
            expected: ExpectBondCreatorUpdateEvent
        ) => deepEqualsBondCreatorUpdateEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected Bond Creator Update events.
 */
export function verifyBondCreatorUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectBondCreatorUpdateEvent[]
): void {
    const actualEvents = bondCreatorUpdateEventLogs(
        eventLog('BondCreatorUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualBondCreatorUpdateEvent,
            expected: ExpectBondCreatorUpdateEvent
        ) => deepEqualsBondCreatorUpdateEvent(actual, expected)
    )
}

/**
 * Verifies the content for the CreateDao event.
 */
export function verifyCreateDaoEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectCreateDaoEvent[]
): void {
    const actualEvents = createDaoEvents(events('CreateDao', receipt))

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (actual: ActualCreateDaoEvent, expected: ExpectCreateDaoEvent) =>
            deepEqualsCreateDaEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected CreateDao events.
 */
export function verifyCreateDaoLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectCreateDaoEvent[]
): void {
    const actualEvents = createDaoEventLogs(
        eventLog('CreateDao', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (actual: ActualCreateDaoEvent, expected: ExpectCreateDaoEvent) =>
            deepEqualsCreateDaEvent(actual, expected)
    )
}

function deepEqualsBondCreatorUpdateEvent(
    actual: ActualBondCreatorUpdateEvent,
    expected: ExpectBondCreatorUpdateEvent
): boolean {
    return (
        actual.previousCreator === expected.previousCreator &&
        actual.updateCreator === expected.updateCreator &&
        actual.instigator === expected.instigator
    )
}
function deepEqualsCreateDaEvent(
    actual: ActualCreateDaoEvent,
    expected: ExpectCreateDaoEvent
): boolean {
    return (
        actual.id.toBigInt() === expected.id &&
        actual.treasury === expected.treasury &&
        actual.instigator === expected.instigator
    )
}
