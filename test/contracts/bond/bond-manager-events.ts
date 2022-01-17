import {Event} from 'ethers'
import {expect} from 'chai'
import {AddBondEvent} from '../../../typechain/BondManager'

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
