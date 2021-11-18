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
import {constants} from 'ethers'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero

describe('BondFactory contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        collateralSymbol = await collateralTokens.symbol()
        bonds = await deployContract<BondFactory>(
            'BondFactory',
            collateralTokens.address,
            treasury
        )
    })

    describe('create bond', () => {
        it('non-whitelisted collateral', async () => {
            await expect(
                bonds.createBond('Named bond', 'AA00AA', 101n, 'BEEP', '')
            ).to.be.revertedWith(
                'BondFactory::bond: collateral not whitelisted'
            )
        })

        it('whitelisted (BIT) collateral', async () => {
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
    })

    describe('collateral whitelist', () => {
        it('update address', async () => {
            const startingAddress = await bonds.collateralTokenAddress(
                collateralSymbol
            )
            expect(startingAddress).equals(collateralTokens.address)
            collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
            expect(await collateralTokens.symbol()).equals(collateralSymbol)
            expect(collateralTokens.address).not.equals(startingAddress)

            await bonds.updateCollateralTokenAddress(collateralTokens.address)

            const updatedAddress = await bonds.collateralTokenAddress(
                collateralSymbol
            )
            expect(updatedAddress).not.equals(startingAddress)
        })

        it('cannot update address to zero', async () => {
            await expect(
                bonds.updateCollateralTokenAddress(ADDRESS_ZERO)
            ).to.be.revertedWith(
                'BondFactory::updateCollateralTokenAddress: collateral tokens is zero address'
            )
        })

        //TODO update a non-erc20

        //TODO add new tokens

        //TODO add existing tokens

        //TODO add address zero

        //TODO add non-erc20
    })

    let admin: string
    let treasury: string
    let collateralTokens: ERC20
    let collateralSymbol: string
    let bonds: BondFactory
})
