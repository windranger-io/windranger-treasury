import {ContractReceipt} from 'ethers'
import {
    ActualAddCollateralEvent,
    ActualRemoveCollateralEvent,
    addCollateralEvent,
    removeCollateralEvent
} from './whitelist-events'

import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'

type ExpectedAddCollateralEvent = {address: string}
type ExpectedRemoveCollateralEvent = {address: string}

/**
 * Verifies the content for an Add Bond event.
 */
export function verifyAddCollateralEvents(
    receipt: ContractReceipt,
    collateralAddedEvents: ExpectedAddCollateralEvent[]
): void {
    const actualEvents = addCollateralEvent(events('AddCollateral', receipt))

    verifyOrderedEvents(
        actualEvents,
        collateralAddedEvents,
        (
            actual: ActualAddCollateralEvent,
            expected: ExpectedAddCollateralEvent
        ) => deepEqualsCollateralEvent(actual, expected)
    )
}

/**
 * Verifies the content for an Remove Collateral event.
 */
export function verifyRemoveCollateralEvents(
    receipt: ContractReceipt,
    removeCollateralEvents: ExpectedRemoveCollateralEvent[]
): void {
    const actualEvents = removeCollateralEvent(
        events('RemoveCollateral', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        removeCollateralEvents,
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
    return actual.address === expected.address
}
