import {BaseContract, ContractReceipt} from 'ethers'
import {expect} from 'chai'
import {events} from '../../framework/events'
import {verifyOrderedEvents} from '../../framework/verify'
import {eventLog} from '../../framework/event-logs'
import {
    erc20TransferEvents,
    deepEqualsERC20TokenTransfer,
    ExpectedERC20Transfer,
    erc20TransferEventLogs,
    ActualERC20Transfer
} from './erc20-events'

/**
 * Verifies the content matches at least one of the Transfer events.
 */
export function verifyERC20TransferEvents(
    receipt: ContractReceipt,
    expectedTransfers: ExpectedERC20Transfer[]
): void {
    const actualTransfers = erc20TransferEvents(events('Transfer', receipt))

    verifyOrderedEvents(
        actualTransfers,
        expectedTransfers,
        (actual: ActualERC20Transfer, expected: ExpectedERC20Transfer) =>
            deepEqualsERC20TokenTransfer(actual, expected)
    )
}

/**
 * Verifies the content matches at least on of the Transfer events from EventLogs
 */
export function verifyERC20TransferEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedERC20Transfer[]
): void {
    const transferEventLogs = erc20TransferEventLogs(
        eventLog('Transfer', emitter, receipt)
    )
    expect(transferEventLogs.length).equals(expectedEvents.length)

    for (let i = 0; i < expectedEvents.length; i++) {
        deepEqualsERC20TokenTransfer(transferEventLogs[i], expectedEvents[i])
    }
}
