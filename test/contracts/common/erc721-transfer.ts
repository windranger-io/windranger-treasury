import {BigNumber, Event} from 'ethers'
import {TransferEvent} from '../../../typechain-types/IERC721'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'

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

export function erc721TransferEventLogsFromResult(
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
