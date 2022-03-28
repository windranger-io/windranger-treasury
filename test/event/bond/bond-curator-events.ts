import {Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {AddBondEvent} from '../../../typechain-types/BondCurator'

export type ActualAddBondEvent = {
    bond: string
}

/**
 * Shape check and conversion for a AddBondEvent.
 */
export function addBondEvents(events: Event[]): ActualAddBondEvent[] {
    const bonds: ActualAddBondEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as AddBondEvent

        const args = create.args
        expect(args?.bond).is.not.undefined

        bonds.push(create.args)
    }

    return bonds
}

/**
 * Shape check and conversion for a event log entry for AddBond.
 */
export function addBondEventLogs(events: Result[]): ActualAddBondEvent[] {
    const results: ActualAddBondEvent[] = []

    for (const event of events) {
        expect(event?.bond).is.not.undefined
        expect(event?.bond).to.be.a('string')
        results.push({bond: String(event.bond)})
    }

    return results
}
