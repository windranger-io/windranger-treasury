import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {CreateDaoEvent} from '../../../typechain-types/BondPortal'

export type ActualCreateDaoEvent = {
    id: BigNumber
    treasury: string
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
        results.push({
            id: BigNumber.from(event.id),
            treasury: String(event.bond)
        })
    }

    return results
}
