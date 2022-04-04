import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {
    BondCreatorUpdateEvent,
    CreateDaoEvent
} from '../../../typechain-types/contracts/bond/BondMediator'

export type ActualCreateDaoEvent = {
    id: BigNumber
    treasury: string
    instigator: string
}

export type ActualBondCreatorUpdateEvent = {
    previousCreator: string
    updateCreator: string
    instigator: string
}

/**
 * Shape check and conversion for a CreateDaoEvent.
 */
export function createDaoEvents(events: Event[]): ActualCreateDaoEvent[] {
    const bonds: ActualCreateDaoEvent[] = []

    for (const event of events) {
        const create = event as CreateDaoEvent
        expect(event.args).is.not.undefined

        const args = create.args
        expect(args?.id).is.not.undefined
        expect(args?.treasury).is.not.undefined
        expect(args?.instigator).is.not.undefined

        bonds.push(create.args)
    }

    return bonds
}

/**
 * Shape check and conversion for an event log entry for CreateDao.
 */
export function createDaoEventLogs(events: Result[]): ActualCreateDaoEvent[] {
    const results: ActualCreateDaoEvent[] = []

    for (const event of events) {
        expect(event?.id).is.not.undefined
        expect(event?.treasury).is.not.undefined
        expect(event?.treasury).to.be.a('string')
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')

        results.push({
            id: BigNumber.from(event.id),
            treasury: String(event.bond),
            instigator: String(event.instigator)
        })
    }

    return results
}

/**
 * Shape check and conversion for a Bond Creator Update event.
 */
export function bondCreatorUpdateEvents(
    events: Event[]
): ActualBondCreatorUpdateEvent[] {
    const bonds: ActualBondCreatorUpdateEvent[] = []

    for (const event of events) {
        const create = event as BondCreatorUpdateEvent
        expect(event.args).is.not.undefined

        const args = create.args
        expect(args?.previousCreator).is.not.undefined
        expect(args?.updateCreator).is.not.undefined
        expect(args?.instigator).is.not.undefined

        bonds.push(create.args)
    }

    return bonds
}

/**
 * Shape check and conversion for an event log entry for Bond Creator Update event.
 */
export function bondCreatorUpdateEventLogs(
    events: Result[]
): ActualBondCreatorUpdateEvent[] {
    const results: ActualBondCreatorUpdateEvent[] = []

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
