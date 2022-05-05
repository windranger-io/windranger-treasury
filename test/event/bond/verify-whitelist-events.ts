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
import {events} from '../../framework/events'
import {eventLog} from '../../framework/event-logs'

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
    const actualEvents = addCollateralEvents(
        events('AddCollateralWhitelist', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualAddCollateralEvent,
            expected: ExpectedAddCollateralEvent
        ) => deepEqualsCollateralEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected AddCollateral events.
 */
export function verifyAddCollateralEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedAddCollateralEvent[]
): void {
    const actualEvents = addCollateralEventLogs(
        eventLog('AddCollateralWhitelist', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualAddCollateralEvent,
            expected: ExpectedAddCollateralEvent
        ) => deepEqualsCollateralEvent(actual, expected)
    )
}

/**
 * Verifies the content for a Remove Collateral event.
 */
export function verifyRemoveCollateralEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedRemoveCollateralEvent[]
): void {
    const actualEvents = removeCollateralEvents(
        events('RemoveCollateralWhitelist', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualAddCollateralEvent,
            expected: ExpectedAddCollateralEvent
        ) => deepEqualsCollateralEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected RemoveCollateral events.
 */
export function verifyRemoveCollateralEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedAddCollateralEvent[]
): void {
    const actualEvents = removeCollateralEventLogs(
        eventLog('RemoveCollateralWhitelist', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualAddCollateralEvent,
            expected: ExpectedAddCollateralEvent
        ) => deepEqualsCollateralEvent(actual, expected)
    )
}

function deepEqualsCollateralEvent(
    actual: ActualAddCollateralEvent | ActualRemoveCollateralEvent,
    expected: ExpectedAddCollateralEvent | ExpectedRemoveCollateralEvent
): boolean {
    return (
        actual.daoId.toBigInt() === expected.daoId &&
        actual.address === expected.address &&
        actual.instigator === expected.instigator
    )
}
