import {ContractReceipt} from 'ethers'
import {
    ActualAddCollateralEvent,
    ActualRemoveCollateralEvent,
    addCollateralEvent,
    removeCollateralEvent
} from './whitelist-events'

import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'

type ExpectedAddCollateralEvent = {
    daoId: bigint
    address: string
    instigator: string
}
type ExpectedRemoveCollateralEvent = {
    daoId: bigint
    address: string
    instigator: string
}

/**
 * Verifies the content for an Add Collateral event.
 */
export function verifyAddCollateralEvents(
    receipt: ContractReceipt,
    collateralAddedEvents: ExpectedAddCollateralEvent[]
): void {
    const actualEvents = addCollateralEvent(
        events('AddCollateralWhitelist', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        collateralAddedEvents,
        (
            actual: ActualAddCollateralEvent,
            expected: ExpectedAddCollateralEvent
        ) => deepEqualsCollateralEvent(actual, expected)
    )
}

// TODO event logs
/**
 * Verifies the content for a Remove Collateral event.
 */
export function verifyRemoveCollateralEvents(
    receipt: ContractReceipt,
    removeCollateralEvents: ExpectedRemoveCollateralEvent[]
): void {
    const actualEvents = removeCollateralEvent(
        events('RemoveCollateralWhitelist', receipt)
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
    return (
        actual.daoId.toBigInt() === expected.daoId &&
        actual.address === expected.address &&
        actual.instigator === expected.instigator
    )
}
