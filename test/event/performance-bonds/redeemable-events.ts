import {Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {RedeemableUpdateEvent} from '../../../typechain-types/contracts/performance-bonds/Redeemable'

export type ActualRedeemableUpdateEvent = {
    isRedeemable: boolean
    reason: string
    instigator: string
}

/**
 * Shape check and conversion for a Redeemable event.
 */
export function redeemableUpdateEvents(
    events: Event[]
): ActualRedeemableUpdateEvent[] {
    const metaData: ActualRedeemableUpdateEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as RedeemableUpdateEvent

        const args = create.args
        expect(args?.isRedeemable).is.not.undefined
        expect(args?.reason).is.not.undefined
        expect(args?.instigator).is.not.undefined

        metaData.push(create.args)
    }

    return metaData
}

/**
 * Shape check and conversion for a event log entry for Redeemable.
 */
export function redeemableUpdateEventLogs(
    events: Result[]
): ActualRedeemableUpdateEvent[] {
    const results: ActualRedeemableUpdateEvent[] = []

    for (const event of events) {
        expect(event?.isRedeemable).is.not.undefined
        expect(event?.reason).is.not.undefined
        expect(event?.reason).to.be.a('string')
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')
        results.push({
            isRedeemable: Boolean(event.isRedeemable),
            reason: String(event.reason),
            instigator: String(event.instigator)
        })
    }

    return results
}
