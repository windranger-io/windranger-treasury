// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BitDAO, DaoBondConfigurationBox, IERC20} from '../../../typechain-types'
import {deployContract, signer} from '../../framework/contracts'
import {constants} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from '../../framework/transaction'
import {
    ExpectedDaoMetaDataUpdateEvent,
    ExpectedDaoTreasuryUpdateEvent,
    verifyDaoMetaDataUpdateEvents,
    verifyDaoMetaDataUpdateLogEvents,
    verifyDaoTreasuryUpdateEvents,
    verifyDaoTreasuryUpdateLogEvents
} from '../../event/bond/verify-dao-bond-configuration-events'

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
        await config.whitelistDaoCollateral(DAO_ID, collateralTokens.address)
    })

    describe('meta data', () => {
        it('update', async () => {
            const configuration = await deployContract<DaoBondConfigurationBox>(
                'DaoBondConfigurationBox'
            )
            await successfulTransaction(
                configuration.daoBondConfiguration(treasury)
            )
            const metaDataUpdate = 'Something very important this way comes'
            expect(await configuration.daoMetaData(DAO_ID)).equals('')

            const receipt = await successfulTransaction(
                configuration.setDaoMetaData(DAO_ID, metaDataUpdate)
            )

            expect(await configuration.daoMetaData(DAO_ID)).equals(
                metaDataUpdate
            )
            const expectedEvents: ExpectedDaoMetaDataUpdateEvent[] = [
                {
                    daoId: DAO_ID,
                    data: metaDataUpdate,
                    instigator: admin
                }
            ]
            verifyDaoMetaDataUpdateEvents(receipt, expectedEvents)
            verifyDaoMetaDataUpdateLogEvents(
                configuration,
                receipt,
                expectedEvents
            )
        })
    })

    describe('treasury', () => {
        it('init', async () => {
            const configuration = await deployContract<DaoBondConfigurationBox>(
                'DaoBondConfigurationBox'
            )
            const receipt = await successfulTransaction(
                configuration.daoBondConfiguration(treasury)
            )

            expect(await config.daoTreasury(DAO_ID)).equals(treasury)
            const treasuryEvents: ExpectedDaoTreasuryUpdateEvent[] = [
                {daoId: DAO_ID, treasury: treasury, instigator: admin}
            ]
            verifyDaoTreasuryUpdateEvents(receipt, treasuryEvents)
            verifyDaoTreasuryUpdateLogEvents(
                configuration,
                receipt,
                treasuryEvents
            )
        })

        describe('retrieve', () => {
            it('invalid DAO id', async () => {
                expect(await config.daoTreasury(INVALID_DAO_ID)).equals(
                    ADDRESS_ZERO
                )
            })
        })

        describe('update', () => {
            afterEach(async () => {
                if ((await config.daoTreasury(DAO_ID)) !== treasury) {
                    await config.setDaoTreasury(DAO_ID, treasury)
                }
            })

            it('to a valid address', async () => {
                expect(await config.daoTreasury(DAO_ID)).equals(treasury)

                const receipt = await successfulTransaction(
                    config.setDaoTreasury(DAO_ID, nonAdmin.address)
                )

                expect(await config.daoTreasury(DAO_ID)).equals(
                    nonAdmin.address
                )
                const treasuryEvents: ExpectedDaoTreasuryUpdateEvent[] = [
                    {
                        daoId: DAO_ID,
                        treasury: nonAdmin.address,
                        instigator: admin
                    }
                ]
                verifyDaoTreasuryUpdateEvents(receipt, treasuryEvents)
                verifyDaoTreasuryUpdateLogEvents(
                    config,
                    receipt,
                    treasuryEvents
                )
            })

            it('cannot be identical', async () => {
                expect(await config.daoTreasury(DAO_ID)).equals(treasury)

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
    let collateralTokens: IERC20
})
