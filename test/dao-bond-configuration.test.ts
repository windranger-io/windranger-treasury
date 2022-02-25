// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BitDAO, DaoBondConfigurationBox} from '../typechain-types'
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
        config = await deployContract<DaoBondConfigurationBox>(
            'DaoBondConfigurationBox'
        )

        await config.daoBondConfiguration(treasury)
        await config.whitelistCollateral(DAO_ID, collateralTokens.address)
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
})
