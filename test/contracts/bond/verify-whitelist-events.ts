import {ContractReceipt} from 'ethers'
import {ActualAddCollateralEvent, addCollateralEvent} from './whitelist-events'

import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'

type ExpectedCollateralAddedEvent = {address: string}

/**
 * Verifies the content for an Add Bond event.
 */
export function verifyCollateralAddedEvents(
    receipt: ContractReceipt,
    collateralAddedEvents: ExpectedCollateralAddedEvent[]
): void {
    const actualEvents = addCollateralEvent(events('AddCollateral', receipt))

    verifyOrderedEvents(
        actualEvents,
        collateralAddedEvents,
        (
            actual: ActualAddCollateralEvent,
            expected: ExpectedCollateralAddedEvent
        ) => deepEqualsCollateralAddedEvent(actual, expected)
    )
}

function deepEqualsCollateralAddedEvent(
    actual: ActualAddCollateralEvent,
    expected: ExpectedCollateralAddedEvent
): boolean {
    return actual.address === expected.address
}
