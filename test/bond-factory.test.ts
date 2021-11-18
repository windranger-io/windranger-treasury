// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {ethers} from 'hardhat'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BitDAO, BondFactory, ERC20} from '../typechain'
import {deployContract, execute, signer} from './utils/contracts'
import {bondCreatedEvent, event, events} from './utils/events'

// Wires up Waffle with Chai
chai.use(solidity)

//TODO extra tests for added code

describe('BondFactory contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        bonds = await deployContract<BondFactory>(
            'BondFactory',
            collateralTokens.address,
            treasury
        )
    })

    it('create bond', async () => {
        const bondName = 'Special Debt Certificate'
        const bondSymbol = 'SDC001'
        const debtTokenAmount = 555666777n
        const collateralSymbol = 'BIT'
        const data = 'a random;delimiter;separated string'

        const receipt = await execute(
            bonds.createBond(
                bondName,
                bondSymbol,
                debtTokenAmount,
                collateralSymbol,
                data
            )
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
        expect(creationEvent.debtSymbol).equals(bondSymbol)
        expect(creationEvent.debtAmount).equals(debtTokenAmount)
        expect(creationEvent.collateralSymbol).equals(collateralSymbol)
        expect(creationEvent.owner).equals(admin)
        expect(creationEvent.treasury).equals(treasury)
        expect(creationEvent.data).equals(data)
    })

    let admin: string
    let treasury: string
    let collateralTokens: ERC20
    let bonds: BondFactory
})
