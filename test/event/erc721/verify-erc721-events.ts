import {BaseContract, ContractReceipt} from 'ethers'
import {expect} from 'chai'
import {events} from '../../framework/events'
import {verifyOrderedEvents} from '../../framework/verify'
import {eventLog} from '../../framework/event-logs'
import {
    ExpectedERC721Transfer,
    ActualERC721Transfer,
    erc721TransferEvents,
    deepEqualsERC721TokenTransfer,
    erc721TransferEventLogs
} from './erc721-events'

/**
 * Verifies the content matches at least one of the Transfer events.
 */
export function verifyERC721TransferEvents(
    receipt: ContractReceipt,
    expectedTransfers: ExpectedERC721Transfer[]
): void {
    const actualTransfers = erc721TransferEvents(events('Transfer', receipt))

    verifyOrderedEvents(
        actualTransfers,
        expectedTransfers,
        (actual: ActualERC721Transfer, expected: ExpectedERC721Transfer) =>
            deepEqualsERC721TokenTransfer(actual, expected)
    )
}

/**
 * Verifies the content matches at least on of the Transfer events from EventLogs
 */
export function verifyERC721TransferEventLogs<T extends BaseContract>(
    expectedEvents: ExpectedERC721Transfer[],
    emitter: T,
    receipt: ContractReceipt
): void {
    const transferEventLogs = erc721TransferEventLogs(
        eventLog('Transfer', emitter, receipt)
    )
    expect(transferEventLogs.length).equals(expectedEvents.length)

    for (let i = 0; i < expectedEvents.length; i++) {
        deepEqualsERC721TokenTransfer(transferEventLogs[i], expectedEvents[i])
    }
}
