import {ExpectTokenTransfer} from '../bond/single-collateral-bond-events'
import {ActualTokenTransfer} from '../bond/verify-single-collateral-bond-events'
import {BigNumber, Event} from 'ethers'
import {TransferEvent} from '../../../typechain/IERC20'
import {expect} from 'chai'

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
export function transferEvents(events: Event[]): {
    from: string
    to: string
    value: BigNumber
}[] {
    const converted: {
        from: string
        to: string
        value: BigNumber
    }[] = []

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
