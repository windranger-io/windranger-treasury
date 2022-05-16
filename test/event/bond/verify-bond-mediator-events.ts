import {BaseContract, ContractReceipt} from 'ethers'
import {verifyOrderedEvents} from '../../framework/verify'
import {
    ActualBondCreatorUpdateEvent,
    ActualCreateDaoEvent,
    bondCreatorUpdateEventLogs,
    bondCreatorUpdateEvents,
    createDaoEventLogs,
    createDaoEvents
} from './bond-mediator-events'
import {parseEventLog, parseEvents} from '../../framework/events'

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
    const actualEvents = parseEvents(
        receipt,
        'BondCreatorUpdate',
        bondCreatorUpdateEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsBondCreatorUpdateEvent
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
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'BondCreatorUpdate',
        bondCreatorUpdateEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsBondCreatorUpdateEvent
    )
}

/**
 * Verifies the content for the CreateDao event.
 */
export function verifyCreateDaoEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectCreateDaoEvent[]
): void {
    const actualEvents = parseEvents(receipt, 'CreateDao', createDaoEvents)

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsCreateDaEvent)
}

/**
 * Verifies the event log entries contain the expected CreateDao events.
 */
export function verifyCreateDaoLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectCreateDaoEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'CreateDao',
        createDaoEventLogs
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsCreateDaEvent)
}

function deepEqualsBondCreatorUpdateEvent(
    expected: ExpectBondCreatorUpdateEvent,
    actual: ActualBondCreatorUpdateEvent
): boolean {
    return (
        actual.previousCreator === expected.previousCreator &&
        actual.updateCreator === expected.updateCreator &&
        actual.instigator === expected.instigator
    )
}
function deepEqualsCreateDaEvent(
    expected: ExpectCreateDaoEvent,
    actual: ActualCreateDaoEvent
): boolean {
    return (
        actual.id.toBigInt() === expected.id &&
        actual.treasury === expected.treasury &&
        actual.instigator === expected.instigator
    )
}
