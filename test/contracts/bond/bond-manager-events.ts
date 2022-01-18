import {Event} from 'ethers'
import {expect} from 'chai'
import {AddBondEvent} from '../../../typechain/BondManager'
import {Result} from '@ethersproject/abi/src.ts/coders/abstract-coder'

/**
 * Shape check and conversion for a AddBondEvent.
 */
export function addBondEvent(event: Event): {
    bond: string
} {
    const create = event as AddBondEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.bond).is.not.undefined

    return create.args
}

/**
 * Shape check and conversion for a event log entry for AddBond.
 */
export function addBondEventLog(event: Result): {
    bond: string
} {
    expect(event?.bond).is.not.undefined
    expect(event?.bond).to.be.a('string')

    return {bond: String(event.bond)}
}
