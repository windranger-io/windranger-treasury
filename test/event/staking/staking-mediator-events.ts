import {Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {StakingPoolCreatorUpdateEvent} from '../../../typechain-types/contracts/staking/StakingPoolMediator'

export type ActualStakingPoolCreatorUpdateEvent = {
    previousCreator: string
    updateCreator: string
    instigator: string
}

export type ExpectedStakingPoolCreatorUpdateEvent = {
    previousCreator: string
    updateCreator: string
    instigator: string
}

/**
 * Shape check and conversion for a Staking Pool Creator Update event.
 */
export function stakingPoolCreatorUpdateEvents(
    events: Event[]
): ActualStakingPoolCreatorUpdateEvent[] {
    const updateEvents: ActualStakingPoolCreatorUpdateEvent[] = []

    for (const event of events) {
        const create = event as StakingPoolCreatorUpdateEvent
        expect(event.args).is.not.undefined

        const args = create.args
        expect(args?.previousCreator).is.not.undefined
        expect(args?.updateCreator).is.not.undefined
        expect(args?.instigator).is.not.undefined

        updateEvents.push(create.args)
    }

    return updateEvents
}

/**
 * Shape check and conversion for an event log entry for Staking Pool Creator Update event.
 */
export function stakingPoolCreatorUpdateEventLogs(
    events: Result[]
): ActualStakingPoolCreatorUpdateEvent[] {
    const results: ActualStakingPoolCreatorUpdateEvent[] = []

    for (const event of events) {
        expect(event?.previousCreator).is.not.undefined
        expect(event?.previousCreator).to.be.a('string')
        expect(event?.updateCreator).is.not.undefined
        expect(event?.updateCreator).to.be.a('string')
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')

        results.push({
            previousCreator: String(event.previousCreator),
            updateCreator: String(event.updateCreator),
            instigator: String(event.instigator)
        })
    }

    return results
}
