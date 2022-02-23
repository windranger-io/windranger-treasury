// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {DaoBondConfigurationBox} from '../typechain-types'
import {deployContract, signer} from './framework/contracts'
import {constants} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero
const INVALID_DAO_ID = 0n
const VALID_DAO_ID = 1n

describe('DAO Bond Configuration contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
        config = await deployContract<DaoBondConfigurationBox>(
            'DaoBondConfigurationBox'
        )

        await config.daoBondConfiguration(treasury)
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
                if ((await config.treasury(VALID_DAO_ID)) !== treasury) {
                    await config.setDaoTreasury(VALID_DAO_ID, treasury)
                }
            })

            it('to a valid address', async () => {
                expect(await config.treasury(VALID_DAO_ID)).equals(treasury)

                await config.setDaoTreasury(VALID_DAO_ID, nonAdmin.address)

                expect(await config.treasury(VALID_DAO_ID)).equals(
                    nonAdmin.address
                )
            })

            it('cannot be identical', async () => {
                expect(await config.treasury(VALID_DAO_ID)).equals(treasury)

                await expect(
                    config.setDaoTreasury(VALID_DAO_ID, treasury)
                ).to.be.revertedWith('DBC: identical treasury address')
            })

            it('cannot be zero', async () => {
                await expect(
                    config.setDaoTreasury(VALID_DAO_ID, ADDRESS_ZERO)
                ).to.be.revertedWith('DBC: treasury address is zero')
            })

            it('invalid DAO id', async () => {
                await expect(
                    config.setDaoTreasury(INVALID_DAO_ID, treasury)
                ).to.be.revertedWith('DBC: invalid DAO Id')
            })
        })
    })

    let admin: string
    let treasury: string
    let nonAdmin: SignerWithAddress
    let config: DaoBondConfigurationBox
})
