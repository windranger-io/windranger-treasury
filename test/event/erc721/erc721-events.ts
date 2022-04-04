import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {TransferEvent} from '../../../typechain-types/@openzeppelin/contracts/token/ERC721/IERC721'

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
export function erc721TransferEvents(events: Event[]): ActualERC721Transfer[] {
    const converted: ActualERC721Transfer[] = []

    for (let i = 0; i < events.length; i++) {
        const transfer = events[i] as TransferEvent
        expect(transfer.args).is.not.undefined

        const args = events[i].args
        expect(args?.from).is.not.undefined
        expect(args?.to).is.not.undefined
        expect(args?.tokenId).is.not.undefined

        converted.push(transfer.args)
    }

    return converted
}

export function erc721TransferEventLogs(
    events: Result[]
): ActualERC721Transfer[] {
    const results: ActualERC721Transfer[] = []

    for (const event of events) {
        expect(event?.to).is.not.undefined
        expect(event?.to).to.be.a('string')

        expect(event?.from).is.not.undefined
        expect(event?.from).to.be.a('string')

        expect(event?.tokenId).is.not.undefined

        results.push({
            to: String(event?.to),
            from: String(event?.from),
            tokenId: BigNumber.from(event?.tokenId)
        })
    }

    return results
}
