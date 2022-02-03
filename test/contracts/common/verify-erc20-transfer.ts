import {ExpectTokenTransfer} from '../bond/single-collateral-bond-events'
import {ActualTokenTransfer} from '../bond/verify-single-collateral-bond-events'
import {BaseContract, ContractReceipt} from 'ethers'
import {expect} from 'chai'
import {events} from '../../framework/events'
import {verifyOrderedEvents} from '../../framework/verify'
import {eventLog} from '../../framework/event-logs'
import {
    erc20TransferEvents,
    deepEqualsERC20TokenTransfer,
    ExpectedERC20Transfer,
    erc20TransferEventLogsFromResult
} from './erc20-transfer'

/**
 * Verifies the content matches at least one of the Transfer events.
 */
export function verifyERC20TransferEvents(
    receipt: ContractReceipt,
    expectedTransfers: ExpectTokenTransfer[]
): void {
    const actualTransfers = erc20TransferEvents(events('Transfer', receipt))

    verifyOrderedEvents(
        actualTransfers,
        expectedTransfers,
        (actual: ActualTokenTransfer, expected: ExpectTokenTransfer) =>
            deepEqualsERC20TokenTransfer(actual, expected)
    )
}

/**
 * Verifies the content for
 */
export function verifyERC20TransferEventLogs<T extends BaseContract>(
    expectedEvent: ExpectedERC20Transfer[],
    emitter: T,
    receipt: ContractReceipt
): void {
    const transferEventLogs = erc20TransferEventLogsFromResult(
        eventLog('Transfer', emitter, receipt)
    )
    expect(transferEventLogs.length).equals(expectedEvent.length)

    for (let i = 0; i < expectedEvent.length; i++) {
        expect(transferEventLogs[i]).to.deep.equal(expectedEvent[i])
    }
}
