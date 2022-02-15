import {BigNumber, Event} from 'ethers'
import {CreateBondEvent} from '../../../typechain-types/BondFactory'
import {expect} from 'chai'

export type ActualCreateBondEvent = {
    bond: string
    name: string
    debtSymbol: string
    debtAmount: BigNumber
    creator: string
    treasury: string
    expiryTimestamp: BigNumber
    data: string
}

/**
 * Shape check and conversion for a CreateBondEvent.
 */
export function createBondEvent(event: Event): ActualCreateBondEvent {
    const create = event as CreateBondEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.bond).is.not.undefined
    expect(args?.name).is.not.undefined
    expect(args?.debtSymbol).is.not.undefined
    expect(args?.debtAmount).is.not.undefined
    expect(args?.creator).is.not.undefined
    expect(args?.treasury).is.not.undefined
    expect(args?.expiryTimestamp).is.not.undefined
    expect(args?.data).is.not.undefined

    return create.args
}
