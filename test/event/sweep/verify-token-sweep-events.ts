import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'
import {
    ActualBeneficiaryUpdateEvent,
    beneficiaryUpdateEventLogs,
    beneficiaryUpdateEvents
} from './token-sweeo-events'

export type ExpectedBeneficiaryUpdateEvent = {
    beneficiary: string
    instigator: string
}

/**
 * Verifies the content for a Beneficiary Update event.
 */
export function verifyBeneficiaryUpdateEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedBeneficiaryUpdateEvent[]
): void {
    const actualEvents = beneficiaryUpdateEvents(
        events('BeneficiaryUpdate', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualBeneficiaryUpdateEvent,
            expected: ExpectedBeneficiaryUpdateEvent
        ) => deepEqualsBeneficiaryUpdateEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected Beneficiary Update events.
 */
export function verifyBeneficiaryUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedBeneficiaryUpdateEvent[]
): void {
    const actualEvents = beneficiaryUpdateEventLogs(
        eventLog('BeneficiaryUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualBeneficiaryUpdateEvent,
            expected: ExpectedBeneficiaryUpdateEvent
        ) => deepEqualsBeneficiaryUpdateEvent(actual, expected)
    )
}

function deepEqualsBeneficiaryUpdateEvent(
    actual: ActualBeneficiaryUpdateEvent,
    expected: ExpectedBeneficiaryUpdateEvent
): boolean {
    return (
        actual.beneficiary === expected.beneficiary &&
        actual.instigator === expected.instigator
    )
}
