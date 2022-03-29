import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {AddBondEvent} from '../../../typechain-types/BondCurator'

export type ActualAddBondEvent = {
    daoId: BigNumber
    bond: string
    instigator: string
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
        expect(args?.daoId).is.not.undefined
        expect(args?.bond).is.not.undefined
        expect(args?.instigator).is.not.undefined

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
        expect(event?.daoId).is.not.undefined
        expect(event?.bond).is.not.undefined
        expect(event?.bond).to.be.a('string')
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')
        results.push({
            daoId: BigNumber.from(event.daoId),
            bond: String(event.bond),
            instigator: String(event.instigator)
        })
    }

    return results
}
