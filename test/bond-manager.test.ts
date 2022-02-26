// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    BitDAO,
    BondFactory,
    BondManager,
    ERC20SingleCollateralBond
} from '../typechain-types'
import {
    deployContract,
    deployContractWithProxy,
    execute,
    signer
} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {constants} from 'ethers'
import {successfulTransaction} from './framework/transaction'
import {erc20SingleCollateralBondContractAt} from './contracts/bond/single-collateral-bond-contract'
import {createBondEvent} from './contracts/bond/bond-creator-events'
import {event} from './framework/events'
import {
    verifyAddBondEvents,
    verifyAddBondLogEvents
} from './contracts/bond/verify-curator-events'
import {ExtendedERC20} from './contracts/cast/extended-erc20'
import {accessControlRevertMessage} from './contracts/bond/bond-access-control-messages'
import {BOND_ADMIN, BOND_AGGREGATOR} from './contracts/bond/roles'

// Wires up Waffle with Chai
chai.use(solidity)

// TODO non valid Bond ID tests
const INVALID_DAO_ID = 0n
const DAO_ID = 1n

describe('Bond Manager contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        nonBondAggregator = await signer(1)
        nonBondAdmin = await signer(2)
        treasury = (await signer(3)).address
        curator = await deployContractWithProxy<BondManager>('BondManager')
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        creator = await deployContractWithProxy<BondFactory>('BondFactory')
    })

    describe('add bond', () => {
        after(async () => {
            if (await curator.paused()) {
                await successfulTransaction(curator.unpause())
            }
        })

        it('only Bond Aggregator', async () => {
            await expect(
                curator
                    .connect(nonBondAggregator)
                    .addBond(DAO_ID, constants.AddressZero)
            ).to.be.revertedWith(
                accessControlRevertMessage(nonBondAggregator, BOND_AGGREGATOR)
            )
        })

        it('not already managing', async () => {
            const bond = await createBond()
            await successfulTransaction(curator.addBond(DAO_ID, bond.address))

            await expect(
                curator.addBond(DAO_ID, bond.address)
            ).to.be.revertedWith('BondManager: already managing')
        })

        it('is the owner', async () => {
            const bond = await createBondWithOwner(admin)

            await expect(
                curator.addBond(DAO_ID, bond.address)
            ).to.be.revertedWith('BondManager: not bond owner')
        })

        it('only to chosen DAO Id', async () => {
            const beforeCountOther = await curator.bondCount(INVALID_DAO_ID)
            const beforeCountChosen = await curator.bondCount(DAO_ID)
            const bond = await createBond()
            await successfulTransaction(curator.addBond(DAO_ID, bond.address))

            expect(await curator.bondCount(DAO_ID)).equals(
                beforeCountChosen.add(1n)
            )
            expect(await curator.bondCount(INVALID_DAO_ID)).equals(
                beforeCountOther
            )
        })

        it('when valid', async () => {
            const bond = await createBond()

            const receipt = await successfulTransaction(
                curator.addBond(DAO_ID, bond.address)
            )
            const createdBondIndex = await curator.bondCount(DAO_ID)
            expect(
                await curator.bondAt(DAO_ID, createdBondIndex.sub(1n))
            ).equals(bond.address)
            const expectedAddBondEvents = [{bond: bond.address}]
            verifyAddBondLogEvents(curator, receipt, expectedAddBondEvents)
            verifyAddBondEvents(receipt, expectedAddBondEvents)
        })

        it('only when not paused', async () => {
            const bond = await createBond()
            expect(await curator.paused()).is.false
            await successfulTransaction(curator.pause())
            expect(await curator.paused()).is.true

            await expect(
                curator.addBond(DAO_ID, bond.address)
            ).to.be.revertedWith('Pausable: paused')
        })
    })

    describe('bond', () => {
        beforeEach(async () => {
            curator = await deployContractWithProxy<BondManager>('BondManager')
            bond = await createBond()
        })

        describe('allow redemption', () => {
            it('delegates', async () => {
                expect(await bond.redeemable()).is.false
                await successfulTransaction(
                    curator.addBond(DAO_ID, bond.address)
                )

                await successfulTransaction(
                    curator.bondAllowRedemption(DAO_ID, bond.address)
                )

                expect(await bond.redeemable()).is.true
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondAllowRedemption(DAO_ID, bond.address)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondAllowRedemption(DAO_ID, bond.address)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonBondAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondAllowRedemption(DAO_ID, bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('pause', () => {
            it('delegates', async () => {
                expect(await bond.paused()).is.false
                await successfulTransaction(
                    curator.addBond(DAO_ID, bond.address)
                )

                await successfulTransaction(
                    curator.bondPause(DAO_ID, bond.address)
                )

                expect(await bond.paused()).is.true
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondPause(DAO_ID, bond.address)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondPause(DAO_ID, bond.address)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonBondAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondPause(DAO_ID, bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('slash', () => {
            it('delegates', async () => {
                await successfulTransaction(
                    curator.addBond(DAO_ID, bond.address)
                )

                await expect(
                    curator.bondSlash(DAO_ID, bond.address, 77n)
                ).to.be.revertedWith('Bond: too large')
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondSlash(DAO_ID, bond.address, 5n)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondSlash(DAO_ID, bond.address, 5n)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonBondAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondSlash(DAO_ID, bond.address, 4n)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('set metadata', () => {
            it('delegates', async () => {
                await successfulTransaction(
                    curator.addBond(DAO_ID, bond.address)
                )
                expect(await bond.metaData()).equals('')

                await successfulTransaction(
                    curator.bondSetMetaData(
                        DAO_ID,
                        bond.address,
                        'new meta data'
                    )
                )

                expect(await bond.metaData()).equals('new meta data')
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondSetMetaData(DAO_ID, bond.address, 'meta')
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondSetMetaData(DAO_ID, bond.address, 'meta')
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonBondAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondSetMetaData(DAO_ID, bond.address, 'data')
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('set treasury', () => {
            it('delegates', async () => {
                await successfulTransaction(
                    curator.addBond(DAO_ID, bond.address)
                )
                expect(await bond.treasury()).equals(treasury)

                await successfulTransaction(
                    curator.bondSetTreasury(
                        DAO_ID,
                        bond.address,
                        curator.address
                    )
                )

                expect(await bond.treasury()).equals(curator.address)
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondSetTreasury(DAO_ID, bond.address, bond.address)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondSetTreasury(DAO_ID, bond.address, bond.address)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonBondAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondSetTreasury(DAO_ID, bond.address, bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('unpause', () => {
            it('delegates', async () => {
                expect(await bond.paused()).is.false
                await successfulTransaction(
                    curator.addBond(DAO_ID, bond.address)
                )
                await successfulTransaction(
                    curator.bondPause(DAO_ID, bond.address)
                )
                expect(await bond.paused()).is.true

                await successfulTransaction(
                    curator.bondUnpause(DAO_ID, bond.address)
                )

                expect(await bond.paused()).is.false
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondUnpause(DAO_ID, bond.address)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondUnpause(DAO_ID, bond.address)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonBondAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondUnpause(DAO_ID, bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('withdraw collateral', () => {
            it('delegates', async () => {
                await successfulTransaction(
                    curator.addBond(DAO_ID, bond.address)
                )

                await expect(
                    curator.bondWithdrawCollateral(DAO_ID, bond.address)
                ).to.be.revertedWith('whenRedeemable: not redeemable')
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondWithdrawCollateral(DAO_ID, bond.address)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondWithdrawCollateral(DAO_ID, bond.address)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonBondAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondWithdrawCollateral(DAO_ID, bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        let bond: ERC20SingleCollateralBond
    })

    describe('pause', () => {
        it('changes state', async () => {
            expect(await curator.paused()).is.true
            await successfulTransaction(curator.unpause())
            expect(await curator.paused()).is.false

            await curator.pause()

            expect(await curator.paused()).is.true
        })

        it('only when not paused', async () => {
            expect(await curator.paused()).is.true

            await expect(curator.pause()).to.be.revertedWith('Pausable: paused')
        })

        it('only bond admin', async () => {
            await expect(
                curator.connect(nonBondAdmin).unpause()
            ).to.be.revertedWith(
                accessControlRevertMessage(nonBondAdmin, BOND_ADMIN)
            )
        })
    })

    describe('unpause', () => {
        it('changes state', async () => {
            expect(await curator.paused()).is.true

            await curator.unpause()

            expect(await curator.paused()).is.false
        })

        it('only when paused', async () => {
            await expect(curator.unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })

        it('only bond admin', async () => {
            await expect(
                curator.connect(nonBondAdmin).pause()
            ).to.be.revertedWith(
                accessControlRevertMessage(nonBondAdmin, BOND_ADMIN)
            )
        })
    })

    async function createBond(): Promise<ERC20SingleCollateralBond> {
        return createBondWithOwner(curator.address)
    }

    async function createBondWithOwner(
        owner: string
    ): Promise<ERC20SingleCollateralBond> {
        const receipt = await execute(
            creator.createBond(
                {name: 'name', symbol: 'symbol'},
                {
                    debtTokenAmount: 100n,
                    collateralTokens: collateralTokens.address,
                    expiryTimestamp: 0n,
                    minimumDeposit: 1n,
                    treasury: treasury,
                    data: ''
                }
            )
        )

        const creationEvent = createBondEvent(event('CreateBond', receipt))
        const bond = await erc20SingleCollateralBondContractAt(
            creationEvent.bond
        )
        await bond.transferOwnership(owner)

        return bond
    }

    let admin: string
    let treasury: string
    let nonBondAdmin: SignerWithAddress
    let nonBondAggregator: SignerWithAddress
    let curator: BondManager
    let collateralTokens: ExtendedERC20
    let creator: BondFactory
})
