// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {ethers} from 'hardhat'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BondFactory} from '../typechain'
import {deployContract, execute, signer} from './utils/contracts'
import {bondCreatedEvent, event, events} from './utils/events'

// Wires up Waffle with Chai
chai.use(solidity)

describe('BondFactory contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        collateral = (await signer(2)).address
        bonds = await deployContract<BondFactory>(
            'BondFactory',
            collateral,
            treasury
        )
    })

    it('create bond', async () => {
        const bondName = 'Special Debt Certificate'
        const bondSymbol = 'SDC001'
        const debtTokenAmount = 555666777n
        const data = 'a random;delimiter;separated string'

        const receipt = await execute(
            bonds.createBond(bondName, bondSymbol, debtTokenAmount, data)
        )

        const creationEvent = bondCreatedEvent(
            event('BondCreated', events(receipt))
        )
        expect(ethers.utils.isAddress(creationEvent.bond)).is.true
        expect(creationEvent.bond).is.not.equal(admin)
        expect(creationEvent.bond).is.not.equal(treasury)
        expect(await ethers.provider.getCode(creationEvent.bond)).is.not
            .undefined
        expect(creationEvent.name).equals(bondName)
        expect(creationEvent.symbol).equals(bondSymbol)
        expect(creationEvent.amount).equals(debtTokenAmount)
        expect(creationEvent.owner).equals(admin)
        expect(creationEvent.treasury).equals(treasury)
        expect(creationEvent.data).equals(data)
    })

    let admin: string
    let treasury: string
    let collateral: string
    let bonds: BondFactory
})
