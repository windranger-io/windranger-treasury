import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {ERC20SweepEvent} from '../../../typechain-types/contracts/sweep/SweepERC20'

export type ActualERC20SweepEvent = {
    beneficiary: string
    tokens: string
    amount: BigNumber
    instigator: string
}

/**
 * Shape check and conversion for a ERC20 Sweep event.
 */
export function erc20SweepEvents(events: Event[]): ActualERC20SweepEvent[] {
    const results: ActualERC20SweepEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as ERC20SweepEvent

        const args = create.args
        expect(args?.beneficiary).is.not.undefined
        expect(args?.tokens).is.not.undefined
        expect(args?.amount).is.not.undefined
        expect(args?.instigator).is.not.undefined

        results.push(create.args)
    }

    return results
}

/**
 * Shape check and conversion for a event log entry for ERC20 Sweep event.
 */
export function erc20SweepEventLogs(events: Result[]): ActualERC20SweepEvent[] {
    const results: ActualERC20SweepEvent[] = []

    for (const event of events) {
        expect(event?.beneficiary).is.not.undefined
        expect(event?.beneficiary).to.be.a('string')
        expect(event?.tokens).is.not.undefined
        expect(event?.tokens).to.be.a('string')
        expect(event?.amount).is.not.undefined
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')
        results.push({
            beneficiary: String(event.beneficiary),
            tokens: String(event.tokens),
            amount: BigNumber.from(event.amount),
            instigator: String(event.instigator)
        })
    }

    return results
}
