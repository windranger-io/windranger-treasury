// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {ethers} from 'hardhat'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BitDAO, BondFactory, Box, ERC20} from '../typechain'
import {deployContract, execute, signer} from './utils/contracts'
import {createBondEvent, event, events} from './utils/events'
import {constants} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero

describe('BondFactory contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
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
                bonds.createBond('Named bond', 'AA00AA', 101n, 'BEEP', 0n, '')
            ).to.be.revertedWith('BF: collateral not whitelisted')
        })

        it('whitelisted (BIT) collateral', async () => {
            const bondName = 'Special Debt Certificate'
            const bondSymbol = 'SDC001'
            const debtTokenAmount = 555666777n
            const collateralSymbol = 'BIT'
            const expiryTimestamp = 560000n
            const data = 'a random;delimiter;separated string'

            const receipt = await execute(
                bonds.createBond(
                    bondName,
                    bondSymbol,
                    debtTokenAmount,
                    collateralSymbol,
                    expiryTimestamp,
                    data
                )
            )

            const creationEvent = createBondEvent(
                event('CreateBond', events(receipt))
            )
            expect(ethers.utils.isAddress(creationEvent.bond)).is.true
            expect(creationEvent.bond).is.not.equal(admin)
            expect(creationEvent.bond).is.not.equal(treasury)
            expect(await ethers.provider.getCode(creationEvent.bond)).is.not
                .undefined
            expect(creationEvent.name).equals(bondName)
            expect(creationEvent.debtSymbol).equals(bondSymbol)
            expect(creationEvent.debtAmount).equals(debtTokenAmount)
            expect(creationEvent.expiryTimestamp).equals(expiryTimestamp)
            expect(creationEvent.owner).equals(admin)
            expect(creationEvent.treasury).equals(treasury)
            expect(creationEvent.data).equals(data)
        })
    })

    describe('collateral whitelist', () => {
        describe('add', () => {
            it('new token', async () => {
                const symbol = 'EEK'
                const tokens = await deployContract<ERC20>(
                    'ERC20',
                    'Another erc20 Token',
                    symbol
                )
                expect(await tokens.symbol()).equals(symbol)

                await bonds.whitelistCollateral(tokens.address)

                expect(await bonds.isCollateralWhitelisted(symbol)).is.true
                expect(await bonds.whitelistedCollateralAddress(symbol)).equals(
                    tokens.address
                )
            })

            it('cannot be an existing token', async () => {
                await expect(
                    bonds.whitelistCollateral(collateralTokens.address)
                ).to.be.revertedWith('Whitelist: already present')
            })

            it('cannot have address zero', async () => {
                await expect(
                    bonds.whitelistCollateral(ADDRESS_ZERO)
                ).to.be.revertedWith('Whitelist: zero address')
            })

            it('cannot be a non-erc20 contract (without fallback)', async () => {
                const box = await deployContract<Box>('Box')

                await expect(
                    bonds.whitelistCollateral(box.address)
                ).to.be.revertedWith(
                    "function selector was not recognized and there's no fallback function"
                )
            })
        })

        describe('update', () => {
            it('existing address', async () => {
                const startingAddress =
                    await bonds.whitelistedCollateralAddress(collateralSymbol)
                expect(startingAddress).equals(collateralTokens.address)
                collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
                expect(await collateralTokens.symbol()).equals(collateralSymbol)
                expect(collateralTokens.address).not.equals(startingAddress)

                await bonds.updateWhitelistedCollateral(
                    collateralTokens.address
                )

                const updatedAddress = await bonds.whitelistedCollateralAddress(
                    collateralSymbol
                )
                expect(updatedAddress).not.equals(startingAddress)
            })

            it('cannot have identical value', async () => {
                await expect(
                    bonds.updateWhitelistedCollateral(collateralTokens.address)
                ).to.be.revertedWith('Whitelist: identical address')
            })

            it('cannot have address zero', async () => {
                await expect(
                    bonds.updateWhitelistedCollateral(ADDRESS_ZERO)
                ).to.be.revertedWith('Whitelist: zero address')
            })

            it('cannot be a non-contract address', async () => {
                await expect(
                    bonds.updateWhitelistedCollateral(admin)
                ).to.be.revertedWith('function call to a non-contract account')
            })

            it('cannot be a non-erc20 contract (without fallback)', async () => {
                const box = await deployContract<Box>('Box')

                await expect(
                    bonds.updateWhitelistedCollateral(box.address)
                ).to.be.revertedWith(
                    "function selector was not recognized and there's no fallback function"
                )
            })
        })

        describe('remove', () => {
            it('entry', async () => {
                expect(await bonds.isCollateralWhitelisted(collateralSymbol)).is
                    .true

                await bonds.removeWhitelistedCollateral(collateralSymbol)

                expect(await bonds.isCollateralWhitelisted(collateralSymbol)).is
                    .false
            })

            it('non-existent entry', async () => {
                const absentSymbol = 'A value not in the whitelist'
                expect(await bonds.isCollateralWhitelisted(absentSymbol)).is
                    .false

                await expect(
                    bonds.removeWhitelistedCollateral(absentSymbol)
                ).to.be.revertedWith('Whitelist: not whitelisted')
            })

            it('only owner', async () => {
                await expect(
                    bonds
                        .connect(nonAdmin)
                        .removeWhitelistedCollateral(collateralSymbol)
                ).to.be.revertedWith('Ownable: caller is not the owner')
            })
        })
    })

    let admin: string
    let treasury: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ERC20
    let collateralSymbol: string
    let bonds: BondFactory
})
