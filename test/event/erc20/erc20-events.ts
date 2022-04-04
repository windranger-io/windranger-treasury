import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {TransferEvent} from '../../../typechain-types/@openzeppelin/contracts/token/ERC20/IERC20'

export type ActualERC20Transfer = {
    from: string
    to: string
    value: BigNumber
}

export type ExpectedERC20Transfer = {
    to: string
    from: string
    amount: bigint
}

export function deepEqualsERC20TokenTransfer(
    actual: ActualERC20Transfer,
    expected: ExpectedERC20Transfer
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
export function erc20TransferEvents(events: Event[]): ActualERC20Transfer[] {
    const converted: ActualERC20Transfer[] = []

    for (let i = 0; i < events.length; i++) {
        const transfer = events[i] as TransferEvent
        expect(transfer.args).is.not.undefined

        const args = events[i].args
        expect(args?.from).is.not.undefined
        expect(args?.to).is.not.undefined
        expect(args?.value).is.not.undefined

        converted.push(transfer.args)
    }

    return converted
}

export function erc20TransferEventLogs(
    events: Result[]
): ActualERC20Transfer[] {
    const results: ActualERC20Transfer[] = []

    for (const event of events) {
        expect(event?.to).is.not.undefined
        expect(event?.to).to.be.a('string')

        expect(event?.from).is.not.undefined
        expect(event?.from).to.be.a('string')

        expect(event?.value).is.not.undefined

        results.push({
            to: String(event?.to),
            from: String(event?.from),
            value: BigNumber.from(event?.value)
        })
    }
    return results
}
