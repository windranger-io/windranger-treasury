// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {ethers} from 'hardhat'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BondFactory} from '../typechain'
import {deployBondFactory, signer} from './utils/contracts'
import {ContractReceipt, ContractTransaction, Event} from 'ethers'
import {BondCreatedEvent} from '../typechain/BondFactory'
import {validateEvents} from './utils/events'

// Wires up Waffle with Chai
chai.use(solidity)

describe('BondFactory contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        bonds = await deployBondFactory(treasury)
    })

    it('create bond', async () => {
        const debtTokens = 555666777n
        const bondName = 'Special Debt Certificate'
        const bondSymbol = 'SDC001'

        const receipt = await execute(
            bonds.createBond(debtTokens, bondName, bondSymbol)
        )

        const events = validateEvents(receipt)
        expect(events.length).equals(4)
        const bondCreated = validateBondCreateEvent(events[3]).args
        expect(ethers.utils.isAddress(bondCreated.bond)).is.true
        expect(bondCreated.bond).is.not.equal(admin)
        expect(bondCreated.bond).is.not.equal(treasury)
        expect(await ethers.provider.getCode(bondCreated.bond)).is.not.undefined
        expect(bondCreated.name).equals(bondName)
        expect(bondCreated.symbol).equals(bondSymbol)
        expect(bondCreated.owner).equals(admin)
        expect(bondCreated.treasury).equals(treasury)
    })

    let admin: string
    let treasury: string
    let bonds: BondFactory
})

async function execute(
    transaction: Promise<ContractTransaction>
): Promise<ContractReceipt> {
    return (await transaction).wait(0)
}

/**
 * Shape check for a BondCreatedEvent
 */
function validateBondCreateEvent(event: Event): BondCreatedEvent {
    const bondCreated = event as BondCreatedEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.bond).is.not.undefined
    expect(args?.name).is.not.undefined
    expect(args?.symbol).is.not.undefined
    expect(args?.owner).is.not.undefined
    expect(args?.treasury).is.not.undefined

    return bondCreated
}
