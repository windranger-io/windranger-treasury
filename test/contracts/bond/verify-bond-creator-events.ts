import {createBondEvent} from './bond-creator-events'
import {event} from '../../framework/events'
import {expect} from 'chai'
import {ethers} from 'hardhat'
import {ContractReceipt} from 'ethers'

/**
 * Verifies the content for a Create Bond event.
 */
export async function verifyCreateBondEvent(
    expected: {
        name: string
        debtSymbol: string
        debtAmount: bigint
        creator: string
        treasury: string
        expiryTimestamp: bigint
        data: string
    },
    receipt: ContractReceipt
): Promise<void> {
    const creationEvent = createBondEvent(event('CreateBond', receipt))
    expect(ethers.utils.isAddress(creationEvent.bond)).is.true
    expect(creationEvent.bond).is.not.equal(expected.creator)
    expect(creationEvent.bond).is.not.equal(expected.treasury)
    expect(await ethers.provider.getCode(creationEvent.bond)).is.not.undefined
    expect(creationEvent.name).equals(expected.name)
    expect(creationEvent.debtSymbol).equals(expected.debtSymbol)
    expect(creationEvent.debtAmount).equals(expected.debtAmount)
    expect(creationEvent.expiryTimestamp).equals(expected.expiryTimestamp)
    expect(creationEvent.creator).equals(expected.creator)
    expect(creationEvent.treasury).equals(expected.treasury)
    expect(creationEvent.data).equals(expected.data)
}
