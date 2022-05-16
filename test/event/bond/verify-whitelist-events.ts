import {BaseContract, ContractReceipt} from 'ethers'
import {
    ActualAddCollateralEvent,
    ActualRemoveCollateralEvent,
    addCollateralEventLogs,
    addCollateralEvents,
    removeCollateralEventLogs,
    removeCollateralEvents
} from './whitelist-events'
import {verifyOrderedEvents} from '../../framework/verify'
import {parseEventLog, parseEvents} from '../../framework/events'

export type ExpectedAddCollateralEvent = {
    daoId: bigint
    address: string
    instigator: string
}

export type ExpectedRemoveCollateralEvent = {
    daoId: bigint
    address: string
    instigator: string
}

/**
 * Verifies the content for an AddCollateral event.
 */
export function verifyAddCollateralEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedAddCollateralEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'AddCollateralWhitelist',
        addCollateralEvents
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsCollateralEvent)
}

/**
 * Verifies the event log entries contain the expected AddCollateral events.
 */
export function verifyAddCollateralEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedAddCollateralEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'AddCollateralWhitelist',
        addCollateralEventLogs
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsCollateralEvent)
}

/**
 * Verifies the content for a Remove Collateral event.
 */
export function verifyRemoveCollateralEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedRemoveCollateralEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'RemoveCollateralWhitelist',
        removeCollateralEvents
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsCollateralEvent)
}

/**
 * Verifies the event log entries contain the expected RemoveCollateral events.
 */
export function verifyRemoveCollateralEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedAddCollateralEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'RemoveCollateralWhitelist',
        removeCollateralEventLogs
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsCollateralEvent)
}

function deepEqualsCollateralEvent(
    expected: ExpectedAddCollateralEvent | ExpectedRemoveCollateralEvent,
    actual: ActualAddCollateralEvent | ActualRemoveCollateralEvent
): boolean {
    return (
        actual.daoId.toBigInt() === expected.daoId &&
        actual.address === expected.address &&
        actual.instigator === expected.instigator
    )
}
