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
    ERC20,
    ERC20PresetMinterPauser
} from '../../../typechain-types'
import {deployContract, signer} from '../../framework/contracts'
import {constants, Wallet} from 'ethers'
import {ExtendedERC20} from '../../cast/extended-erc20'
import {successfulTransaction} from '../../framework/transaction'
import {
    verifyAddCollateralEvents,
    verifyRemoveCollateralEvents
} from '../../event/bond/verify-whitelist-events'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero
const INVALID_DAO_ID = 0n
const DAO_ID = 1n

describe('DAO Bond Collateral Whitelist contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        config = await deployContract<DaoBondConfigurationBox>(
            'DaoBondConfigurationBox'
        )

        await config.daoBondConfiguration(treasury)
        await config.whitelistDaoCollateral(DAO_ID, collateralTokens.address)
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

                const receipt = await successfulTransaction(
                    config.whitelistDaoCollateral(DAO_ID, tokens.address)
                )
                verifyAddCollateralEvents(receipt, [
                    {
                        address: tokens.address,
                        instigator: admin
                    }
                ])

                expect(
                    await config.isAllowedDaoCollateral(DAO_ID, tokens.address)
                ).is.true
            })

            it('cannot be an existing token', async () => {
                await expect(
                    config.whitelistDaoCollateral(
                        DAO_ID,
                        collateralTokens.address
                    )
                ).to.be.revertedWith('DAO Collateral: already present')
            })

            it('cannot have address zero', async () => {
                await expect(
                    config.whitelistDaoCollateral(DAO_ID, ADDRESS_ZERO)
                ).to.be.revertedWith('DAO Collateral: zero address')
            })

            it('cannot be a non-erc20 contract (without fallback)', async () => {
                const box = await deployContract<Box>('Box')

                await expect(
                    config.whitelistDaoCollateral(DAO_ID, box.address)
                ).to.be.revertedWith(
                    "function selector was not recognized and there's no fallback function"
                )
            })

            it('invalid DAO id', async () => {
                await expect(
                    config.whitelistDaoCollateral(
                        INVALID_DAO_ID,
                        collateralTokens.address
                    )
                ).to.be.revertedWith('DAO Collateral: invalid DAO id')
            })
        })

        describe('get all', () => {
            it('entries', async () => {
                const startingList = await config.daoCollateralSymbolWhitelist(
                    DAO_ID
                )
                const specialSymbol = 'SYMBOL_FOR_GET_ALL_WHITELIST'
                expect(startingList).does.not.contain(specialSymbol)

                const exampleCollateralErc20 = await deployContract<ERC20>(
                    '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
                    'Name',
                    specialSymbol
                )
                await successfulTransaction(
                    config.whitelistDaoCollateral(
                        DAO_ID,
                        exampleCollateralErc20.address
                    )
                )
                const result: string[] =
                    await config.daoCollateralSymbolWhitelist(DAO_ID)
                expect(result.length).to.equal(startingList.length + 1)
                expect(result).to.contain(specialSymbol)
            })
        })

        describe('remove', () => {
            after(async () => {
                if (
                    !(await config.isAllowedDaoCollateral(
                        DAO_ID,
                        collateralTokens.address
                    ))
                ) {
                    await config.whitelistDaoCollateral(
                        DAO_ID,
                        collateralTokens.address
                    )
                }
            })
            it('entry', async () => {
                expect(
                    await config.isAllowedDaoCollateral(
                        DAO_ID,
                        collateralTokens.address
                    )
                ).is.true

                const receipt = await successfulTransaction(
                    config.removeWhitelistedDaoCollateral(
                        DAO_ID,
                        collateralTokens.address
                    )
                )
                verifyRemoveCollateralEvents(receipt, [
                    {
                        address: collateralTokens.address,
                        instigator: admin
                    }
                ])

                expect(
                    await config.isAllowedDaoCollateral(
                        DAO_ID,
                        collateralTokens.address
                    )
                ).is.false
            })

            it('non-existent entry', async () => {
                const absentAddress = Wallet.createRandom().address
                expect(
                    await config.isAllowedDaoCollateral(DAO_ID, absentAddress)
                ).is.false

                await expect(
                    config.removeWhitelistedDaoCollateral(DAO_ID, absentAddress)
                ).to.be.revertedWith('DAO Collateral: not whitelisted')
            })

            it('invalid DAO id', async () => {
                await expect(
                    config.removeWhitelistedDaoCollateral(
                        INVALID_DAO_ID,
                        collateralTokens.address
                    )
                ).to.be.revertedWith('DAO Collateral: invalid DAO id')
            })
        })
    })

    let admin: string
    let treasury: string
    let config: DaoBondConfigurationBox
    let collateralTokens: ExtendedERC20
})
