import {Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {RedeemableEvent} from '../../../typechain-types/Redeemable'

export type ActualRedeemableEvent = {
    instigator: string
}

/**
 * Shape check and conversion for a Redeemable event.
 */
export function redeemableEvents(events: Event[]): ActualRedeemableEvent[] {
    const metaData: ActualRedeemableEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as RedeemableEvent

        const args = create.args
        expect(args?.instigator).is.not.undefined

        metaData.push(create.args)
    }

    return metaData
}

/**
 * Shape check and conversion for a event log entry for Redeemable.
 */
export function redeemableEventLogs(events: Result[]): ActualRedeemableEvent[] {
    const results: ActualRedeemableEvent[] = []

    for (const event of events) {
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')
        results.push({
            instigator: String(event.instigator)
        })
    }

    return results
}
