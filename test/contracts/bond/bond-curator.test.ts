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
    BondCuratorBox,
    ERC20SingleCollateralBondBox,
    IERC20
} from '../../../typechain-types'
import {deployContract, execute, signer} from '../../framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from '../../framework/transaction'
import {erc20SingleCollateralBondContractAt} from '../../event/bond/single-collateral-bond-contract'
import {events} from '../../framework/events'
import {DAO_ADMIN, DAO_MEEPLE, SYSTEM_ADMIN} from '../../event/bond/roles'
import {accessControlRevertMessageMissingGlobalRole} from '../../event/bond/access-control-messages'
import {
    verifyAddBondEvents,
    verifyAddBondLogEvents
} from '../../event/bond/verify-curator-events'
import {createBondEvents} from '../../event/bond/bond-creator-events'

// Wires up Waffle with Chai
chai.use(solidity)

const INVALID_DAO_ID = 0n
const DAO_ID = 1n
const REDEMPTION_REASON = 'test redemption reason string'
const BOND_SLASH_REASON = 'example slash reason'

describe('Bond Curator contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        nonBondAdmin = await signer(1)
        treasury = (await signer(2)).address
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        otherCollateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        creator = await deployContract<BondFactory>('BondFactory', treasury)
        curator = await deployContract<BondCuratorBox>('BondCuratorBox')
        await successfulTransaction(curator.initialize())
    })

    describe('add bond', () => {
        after(async () => {
            if (await curator.paused()) {
                await successfulTransaction(curator.unpause())
            }
        })

        it('not already managing', async () => {
            const bond = await createBond()
            await successfulTransaction(curator.addBond(DAO_ID, bond.address))

            await expect(
                curator.addBond(DAO_ID, bond.address)
            ).to.be.revertedWith('BondCurator: already managing')
        })

        it('is the owner', async () => {
            const bond = await createBondWithOwner(admin)

            await expect(
                curator.addBond(DAO_ID, bond.address)
            ).to.be.revertedWith('BondCurator: not bond owner')
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

            const expectedAddBondEvents = [
                {bond: bond.address, instigator: admin}
            ]
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
            curator = await deployContract<BondCuratorBox>('BondCuratorBox')
            await successfulTransaction(curator.initialize())
            bond = await createBond()
        })

        describe('allow redemption', () => {
            it('delegates', async () => {
                expect(await bond.redeemable()).is.false
                await successfulTransaction(
                    curator.addBond(DAO_ID, bond.address)
                )

                await successfulTransaction(
                    curator.bondAllowRedemption(
                        DAO_ID,
                        bond.address,
                        REDEMPTION_REASON
                    )
                )

                expect(await bond.redeemable()).is.true
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondAllowRedemption(
                        DAO_ID,
                        bond.address,
                        REDEMPTION_REASON
                    )
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao meeple role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondAllowRedemption(
                            DAO_ID,
                            bond.address,
                            REDEMPTION_REASON
                        )
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonBondAdmin,
                        DAO_MEEPLE
                    )
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondAllowRedemption(
                        DAO_ID,
                        bond.address,
                        REDEMPTION_REASON
                    )
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
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao admin role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondPause(DAO_ID, bond.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonBondAdmin,
                        DAO_ADMIN
                    )
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
                    curator.bondSlash(
                        DAO_ID,
                        bond.address,
                        77n,
                        BOND_SLASH_REASON
                    )
                ).to.be.revertedWith('Bond: too large')
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondSlash(
                        DAO_ID,
                        bond.address,
                        5n,
                        BOND_SLASH_REASON
                    )
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao meeple role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondSlash(DAO_ID, bond.address, 5n, BOND_SLASH_REASON)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonBondAdmin,
                        DAO_MEEPLE
                    )
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondSlash(
                        DAO_ID,
                        bond.address,
                        4n,
                        BOND_SLASH_REASON
                    )
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
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao meeple role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondSetMetaData(DAO_ID, bond.address, 'meta')
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonBondAdmin,
                        DAO_MEEPLE
                    )
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
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao admin role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondSetTreasury(DAO_ID, bond.address, bond.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonBondAdmin,
                        DAO_ADMIN
                    )
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

        describe('token sweep', () => {
            it('side effects', async () => {
                const seedFunds = 100n
                const sweepAmount = 55n
                await curator.addBond(DAO_ID, bond.address)
                await successfulTransaction(
                    otherCollateralTokens.transfer(bond.address, seedFunds)
                )
                expect(
                    await otherCollateralTokens.balanceOf(bond.address)
                ).equals(seedFunds)
                expect(await otherCollateralTokens.balanceOf(treasury)).equals(
                    0
                )

                await successfulTransaction(
                    curator.bondSweepERC20Tokens(
                        DAO_ID,
                        bond.address,
                        otherCollateralTokens.address,
                        sweepAmount
                    )
                )

                expect(
                    await otherCollateralTokens.balanceOf(bond.address)
                ).equals(seedFunds - sweepAmount)
                expect(await otherCollateralTokens.balanceOf(treasury)).equals(
                    sweepAmount
                )
            })

            it('at least dao admin role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondSweepERC20Tokens(
                            DAO_ID,
                            bond.address,
                            collateralTokens.address,
                            10
                        )
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonBondAdmin,
                        DAO_ADMIN
                    )
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondSweepERC20Tokens(
                        DAO_ID,
                        bond.address,
                        collateralTokens.address,
                        10
                    )
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
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao admin role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondUnpause(DAO_ID, bond.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonBondAdmin,
                        DAO_ADMIN
                    )
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
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao admin role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondWithdrawCollateral(DAO_ID, bond.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonBondAdmin,
                        DAO_ADMIN
                    )
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

        let bond: ERC20SingleCollateralBondBox
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

        it('at least system admin role', async () => {
            await expect(
                curator.connect(nonBondAdmin).unpause()
            ).to.be.revertedWith(
                accessControlRevertMessageMissingGlobalRole(
                    nonBondAdmin,
                    SYSTEM_ADMIN
                )
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

        it('at least system admin role', async () => {
            await expect(
                curator.connect(nonBondAdmin).pause()
            ).to.be.revertedWith(
                accessControlRevertMessageMissingGlobalRole(
                    nonBondAdmin,
                    SYSTEM_ADMIN
                )
            )
        })
    })

    async function createBond(): Promise<ERC20SingleCollateralBondBox> {
        return createBondWithOwner(curator.address)
    }

    async function createBondWithOwner(
        owner: string
    ): Promise<ERC20SingleCollateralBondBox> {
        const receipt = await execute(
            creator.createBond(
                {name: 'name', symbol: 'symbol', data: ''},
                {
                    debtTokenAmount: 100n,
                    collateralTokens: collateralTokens.address,
                    expiryTimestamp: 0n,
                    minimumDeposit: 1n
                },
                [],
                treasury
            )
        )

        const creationEvent = createBondEvents(events('CreateBond', receipt))[0]
        const bond = await erc20SingleCollateralBondContractAt(
            creationEvent.bond
        )
        await bond.transferOwnership(owner)

        return bond
    }

    let admin: string
    let treasury: string
    let nonBondAdmin: SignerWithAddress
    let curator: BondCuratorBox
    let collateralTokens: IERC20
    let otherCollateralTokens: IERC20
    let creator: BondFactory
})
