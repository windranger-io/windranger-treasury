import {ContractReceipt} from 'ethers'
import {
    ActualAddCollateralEvent,
    collateralAddedEvent
} from './whitelist-events'

import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'

type ExpectedCollateralAddedEvent = {address: string; symbol: string}

/**
 * Verifies the content for an Add Bond event.
 */
export function verifyCollateralAddedEvents(
    receipt: ContractReceipt,
    collateralAddedEvents: ExpectedCollateralAddedEvent[]
): void {
    const actualEvents = collateralAddedEvent(
        events('CollateralAdded', receipt)
    )

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
    return (
        actual.address === expected.address && actual.symbol === expected.symbol
    )
}
