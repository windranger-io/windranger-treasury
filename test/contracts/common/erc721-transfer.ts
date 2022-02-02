import {BigNumber, BaseContract, ContractReceipt, Event} from 'ethers'
import {TransferEvent} from '../../../typechain/IERC721'
import {expect} from 'chai'
import {events} from '../../framework/events'
import {verifyOrderedEvents} from '../../framework/verify'
import {eventLog} from '../../framework/event-logs'
import {Result} from '@ethersproject/abi'
import {log} from '../../../config/logging'

export function deepEqualsERC721TokenTransfer(
    actual: ActualERC721Transfer,
    expected: ExpectedERC721Transfer
): boolean {
    return (
        actual.to === expected.to &&
        actual.from === expected.from &&
        actual.tokenId.toBigInt() === expected.tokenId
    )
}

/**
 * Shape check and conversion for a TransferEvents.
 */
export function erc721TransferEvents(_events: Event[]): {
    from: string
    to: string
    tokenId: BigNumber
}[] {
    const converted: {
        from: string
        to: string
        tokenId: BigNumber
    }[] = []

    for (let i = 0; i < _events.length; i++) {
        const transfer = _events[i] as TransferEvent
        expect(transfer.args).is.not.undefined

        const args = _events[i].args
        expect(args?.from).is.not.undefined
        expect(args?.to).is.not.undefined
        expect(args?.tokenId).is.not.undefined

        converted.push(transfer.args)
    }

    return converted
}

/**
 * Verifies the content matches at least one of the Transfer events.
 */
export function verifyERC20TransferEvents(
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

export type ExpectedERC721Transfer = {
    to: string
    from: string
    tokenId: bigint
}
export type ActualERC721Transfer = {
    to: string
    from: string
    tokenId: BigNumber
}
/**
 * Verifies the content forW
 */
export function verifyERC721TransferEventLogs<T extends BaseContract>(
    expectedEvent: ExpectedERC721Transfer[],
    emitter: T,
    receipt: ContractReceipt
): void {
    const transferEventLogResults = eventLog('Transfer', emitter, receipt)
    const transferEventLogs = erc721TransferEventLogsFromResult(
        transferEventLogResults
    )
    expect(transferEventLogs.length).equals(expectedEvent.length)

    for (let i = 0; i < expectedEvent.length; i++) {
        expect(transferEventLogs[i]).to.deep.equal(expectedEvent[i])
    }
}

function erc721TransferEventLogsFromResult(
    _events: Result
): ExpectedERC721Transfer[] {
    const results: ExpectedERC721Transfer[] = []

    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    for (const event of _events) {
        expect(event?.to).is.not.undefined
        expect(event?.to).to.be.a('string')

        expect(event?.from).is.not.undefined
        expect(event?.from).to.be.a('string')

        expect(event?.tokenId).is.not.undefined
        expect(event?.tokenId._isBigNumber).to.be.true

        results.push({
            to: String(event?.to),
            from: String(event?.from),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            tokenId: BigInt(event?.tokenId)
        })
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */

    return results
}
