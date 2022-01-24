import {Event} from 'ethers'
import {expect} from 'chai'
import {AddBondEvent} from '../../../typechain/BondManager'
import {Result} from '@ethersproject/abi'

type AddBond = {
    bond: string
}

/**
 * Shape check and conversion for a AddBondEvent.
 */
export function addBondEvent(event: Event): AddBond {
    const create = event as AddBondEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.bond).is.not.undefined

    return create.args
}

/**
 * Shape check and conversion for a event log entry for AddBond.
 */
export function addBondEventLogs(events: Result[]): AddBond[] {
    const results: AddBond[] = []

    for (const event of events) {
        expect(event?.bond).is.not.undefined
        expect(event?.bond).to.be.a('string')
        results.push({bond: String(event.bond)})
    }

    return results
}
