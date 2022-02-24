// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    BitDAO,
    Box,
    DaoBondConfigurationBox,
    ERC20PresetMinterPauser
} from '../typechain-types'
import {deployContract, signer} from './framework/contracts'
import {constants} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ExtendedERC20} from './contracts/cast/extended-erc20'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero
const INVALID_DAO_ID = 0n
const DAO_ID = 1n

describe('DAO Bond Configuration contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        collateralSymbol = await collateralTokens.symbol()
        config = await deployContract<DaoBondConfigurationBox>(
            'DaoBondConfigurationBox'
        )

        await config.daoBondConfiguration(treasury)
        await config.whitelistCollateral(DAO_ID, collateralTokens.address)
    })

    describe('collateral whitelist', () => {
        describe('add', () => {
            it('new token', async () => {
                const symbol = 'EEK'
                const tokens = await deployContract<ERC20PresetMinterPauser>(
                    'ERC20PresetMinterPauser',
                    'Another erc20 Token',
                    symbol
                )
                expect(await tokens.symbol()).equals(symbol)

                await config.whitelistCollateral(DAO_ID, tokens.address)

                expect(await config.isCollateralWhitelisted(DAO_ID, symbol)).is
                    .true
                expect(
                    await config.whitelistedCollateralAddress(DAO_ID, symbol)
                ).equals(tokens.address)
            })

            it('cannot be an existing token', async () => {
                await expect(
                    config.whitelistCollateral(DAO_ID, collateralTokens.address)
                ).to.be.revertedWith('DAO Collateral: already present')
            })

            it('cannot have address zero', async () => {
                await expect(
                    config.whitelistCollateral(DAO_ID, ADDRESS_ZERO)
                ).to.be.revertedWith('DAO Collateral: zero address')
            })

            it('cannot be a non-erc20 contract (without fallback)', async () => {
                const box = await deployContract<Box>('Box')

                await expect(
                    config.whitelistCollateral(DAO_ID, box.address)
                ).to.be.revertedWith(
                    "function selector was not recognized and there's no fallback function"
                )
            })
        })

        describe('update', () => {
            it('cannot have identical value', async () => {
                await expect(
                    config.updateWhitelistedCollateral(
                        DAO_ID,
                        collateralTokens.address
                    )
                ).to.be.revertedWith('DAO Collateral: same address')
            })

            it('cannot have address zero', async () => {
                await expect(
                    config.updateWhitelistedCollateral(DAO_ID, ADDRESS_ZERO)
                ).to.be.revertedWith('DAO Collateral: zero address')
            })

            it('cannot be a non-contract address', async () => {
                await expect(
                    config.updateWhitelistedCollateral(DAO_ID, admin)
                ).to.be.revertedWith('function call to a non-contract account')
            })

            it('cannot be a non-erc20 contract (without fallback)', async () => {
                const box = await deployContract<Box>('Box')

                await expect(
                    config.updateWhitelistedCollateral(DAO_ID, box.address)
                ).to.be.revertedWith(
                    "function selector was not recognized and there's no fallback function"
                )
            })

            it('existing address', async () => {
                const startingAddress =
                    await config.whitelistedCollateralAddress(
                        DAO_ID,
                        collateralSymbol
                    )
                expect(startingAddress).equals(collateralTokens.address)
                const altCollateralTokens = await deployContract<BitDAO>(
                    'BitDAO',
                    admin
                )
                expect(await altCollateralTokens.symbol()).equals(
                    collateralSymbol
                )
                expect(altCollateralTokens.address).not.equals(startingAddress)

                await config.updateWhitelistedCollateral(
                    DAO_ID,
                    altCollateralTokens.address
                )

                const updatedAddress =
                    await config.whitelistedCollateralAddress(
                        DAO_ID,
                        collateralSymbol
                    )
                expect(updatedAddress).not.equals(startingAddress)
            })
        })

        describe('remove', () => {
            after(async () => {
                if (
                    !(await config.isCollateralWhitelisted(
                        DAO_ID,
                        collateralSymbol
                    ))
                ) {
                    await config.whitelistCollateral(
                        DAO_ID,
                        collateralTokens.address
                    )
                }
            })
            it('entry', async () => {
                expect(
                    await config.isCollateralWhitelisted(
                        DAO_ID,
                        collateralSymbol
                    )
                ).is.true

                await config.removeWhitelistedCollateral(
                    DAO_ID,
                    collateralSymbol
                )

                expect(
                    await config.isCollateralWhitelisted(
                        DAO_ID,
                        collateralSymbol
                    )
                ).is.false
            })

            it('non-existent entry', async () => {
                const absentSymbol = 'A value not in the whitelist'
                expect(
                    await config.isCollateralWhitelisted(DAO_ID, absentSymbol)
                ).is.false

                await expect(
                    config.removeWhitelistedCollateral(DAO_ID, absentSymbol)
                ).to.be.revertedWith('DAO Collateral: not whitelisted')
            })
        })
    })

    describe('treasury', () => {
        describe('retrieve', () => {
            it('invalid DAO id', async () => {
                expect(await config.treasury(INVALID_DAO_ID)).equals(
                    ADDRESS_ZERO
                )
            })
        })

        describe('update', () => {
            afterEach(async () => {
                if ((await config.treasury(DAO_ID)) !== treasury) {
                    await config.setDaoTreasury(DAO_ID, treasury)
                }
            })

            it('to a valid address', async () => {
                expect(await config.treasury(DAO_ID)).equals(treasury)

                await config.setDaoTreasury(DAO_ID, nonAdmin.address)

                expect(await config.treasury(DAO_ID)).equals(nonAdmin.address)
            })

            it('cannot be identical', async () => {
                expect(await config.treasury(DAO_ID)).equals(treasury)

                await expect(
                    config.setDaoTreasury(DAO_ID, treasury)
                ).to.be.revertedWith('DAO Treasury: identical address')
            })

            it('cannot be zero', async () => {
                await expect(
                    config.setDaoTreasury(DAO_ID, ADDRESS_ZERO)
                ).to.be.revertedWith('DAO Treasury: address is zero')
            })

            it('invalid DAO id', async () => {
                await expect(
                    config.setDaoTreasury(INVALID_DAO_ID, treasury)
                ).to.be.revertedWith('DAO Treasury: invalid DAO Id')
            })
        })
    })

    let admin: string
    let treasury: string
    let nonAdmin: SignerWithAddress
    let config: DaoBondConfigurationBox
    let collateralTokens: ExtendedERC20
    let collateralSymbol: string
})
