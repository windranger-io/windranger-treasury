import {ExpectTokenTransfer} from '../bond/single-collateral-bond-events'
import {ActualTokenTransfer} from '../bond/verify-single-collateral-bond-events'
import {BigNumber, BaseContract, ContractReceipt, Event} from 'ethers'
import {TransferEvent} from '../../../typechain/IERC20'
import {expect} from 'chai'
import {events} from '../../framework/events'
import {verifyOrderedEvents} from '../../framework/verify'
import {eventLog} from '../../framework/event-logs'
import {Result} from '@ethersproject/abi'
import {log} from '../../../config/logging'

export function deepEqualsTokenTransfer(
    actual: ActualTokenTransfer,
    expected: ExpectTokenTransfer
): boolean {
    return (
        actual.to === expected.to &&
        actual.from === expected.from &&
        actual.value.toBigInt() === expected.amount
    )
}

/**
 * Shape check and conversion for a TransferEvents.
 */
export function transferEvents(_events: Event[]): {
    from: string
    to: string
    value: BigNumber
}[] {
    const converted: {
        from: string
        to: string
        value: BigNumber
    }[] = []

    for (let i = 0; i < _events.length; i++) {
        const transfer = _events[i] as TransferEvent
        expect(transfer.args).is.not.undefined

        const args = _events[i].args
        expect(args?.from).is.not.undefined
        expect(args?.to).is.not.undefined
        expect(args?.value).is.not.undefined

        converted.push(transfer.args)
    }

    return converted
}

/**
 * Verifies the content matches at least one of the Transfer events.
 */
export function verifyTransferEvents(
    receipt: ContractReceipt,
    expectedTransfers: ExpectTokenTransfer[]
): void {
    const actualTransfers = transferEvents(events('Transfer', receipt))

    verifyOrderedEvents(
        actualTransfers,
        expectedTransfers,
        (actual: ActualTokenTransfer, expected: ExpectTokenTransfer) =>
            deepEqualsTokenTransfer(actual, expected)
    )
}

export type ExpectedTransfer = {
    to: string
    from: string
    amount: bigint
}

/**
 * Verifies the content forW
 */
export function verifyTransferEventLogs<T extends BaseContract>(
    expectedEvent: ExpectedTransfer[],
    emitter: T,
    receipt: ContractReceipt
): void {
    const transferEventLogResults = eventLog('Transfer', emitter, receipt)
    const transferEventLogs = transferEventLogsFromResult(
        transferEventLogResults
    )
    expect(transferEventLogs.length).equals(expectedEvent.length)

    for (let i = 0; i < expectedEvent.length; i++) {
        expect(transferEventLogs[i]).to.deep.equal(expectedEvent[i])
    }
}

function transferEventLogsFromResult(_events: Result): ExpectedTransfer[] {
    const results: ExpectedTransfer[] = []

    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    for (const event of _events) {
        expect(event?.to).is.not.undefined
        expect(event?.to).to.be.a('string')

        expect(event?.from).is.not.undefined
        expect(event?.from).to.be.a('string')

        expect(event?.value).is.not.undefined
        // expect(event?.value).to.be.a('bignumber') // ? correct type?

        results.push({
            to: String(event?.to),
            from: String(event?.from),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            amount: BigInt(event?.value)
        })
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */

    return results
}
