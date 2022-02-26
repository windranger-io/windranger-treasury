import {BaseContract, ContractReceipt} from 'ethers'
import {ActualAddCollateralEvent, addCollateralEvent} from './whitelist-events'

import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'

type ExpectedAddCollateralEvent = {address: string; symbol: string}

/**
 * Verifies the content for an Add Bond event.
 */
export function verifyCollateralAddedEvents(
    receipt: ContractReceipt,
    addCollateralEvents: ExpectedAddCollateralEvent[]
): void {
    const actualEvents = addCollateralEvent(events('CollateralAdded', receipt))

    verifyOrderedEvents(
        actualEvents,
        addCollateralEvents,
        (
            actual: ActualAddCollateralEvent,
            expected: ExpectedAddCollateralEvent
        ) => deepEqualsCollateralAddedEvent(actual, expected)
    )
}

function deepEqualsCollateralAddedEvent(
    actual: ActualAddCollateralEvent,
    expected: ExpectedAddCollateralEvent
): boolean {
    return (
        actual.address === expected.address && actual.symbol === expected.symbol
    )
}
