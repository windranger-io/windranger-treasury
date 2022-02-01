import {ExpectTokenTransfer} from '../bond/single-collateral-bond-events'
import {ActualTokenTransfer} from '../bond/verify-single-collateral-bond-events'
import {BigNumber, ContractReceipt, Event} from 'ethers'
import {TransferEvent} from '../../../typechain/IERC20'
import {expect} from 'chai'
import {events} from '../../framework/events'
import {verifyOrderedEvents} from '../../framework/verify'

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
