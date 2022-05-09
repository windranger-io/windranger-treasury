import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {events} from '../../framework/events'
import {
    ActualERC20SweepEvent,
    erc20SweepEventLogs,
    erc20SweepEvents
} from './sweep-erc20-events'

export type ExpectedERC20SweepEvent = {
    beneficiary: string
    tokens: string
    amount: bigint
    instigator: string
}

/**
 * Verifies the content for a ERC20 Sweep event.
 */
export function verifyERC20SweepEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedERC20SweepEvent[]
): void {
    const actualEvents = erc20SweepEvents(events('ERC20Sweep', receipt))

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectedERC20SweepEvent, actual: ActualERC20SweepEvent) =>
            deepEqualsErc20SweepEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected Beneficiary Update events.
 */
export function verifyERC20SweepLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedERC20SweepEvent[]
): void {
    const actualEvents = erc20SweepEventLogs(
        eventLog('ERC20Sweep', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectedERC20SweepEvent, actual: ActualERC20SweepEvent) =>
            deepEqualsErc20SweepEvent(expected, actual)
    )
}

function deepEqualsErc20SweepEvent(
    expected: ExpectedERC20SweepEvent,
    actual: ActualERC20SweepEvent
): boolean {
    return (
        actual.beneficiary === expected.beneficiary &&
        actual.tokens === expected.tokens &&
        actual.amount.toBigInt() === expected.amount &&
        actual.instigator === expected.instigator
    )
}
