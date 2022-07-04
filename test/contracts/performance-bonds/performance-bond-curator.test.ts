// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    BitDAO,
    PerformanceBondFactory,
    BondCuratorBox,
    ERC20SingleCollateralBondBox,
    IERC20
} from '../../../typechain-types'
import {deployContract, execute, signer} from '../../framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from '../../framework/transaction'
import {erc20SingleCollateralPerformanceBondContractAt} from '../../event/performance-bonds/single-collateral-performance-bond-contract'
import {events} from '../../framework/events'
import {
    DAO_ADMIN,
    DAO_MEEPLE,
    SYSTEM_ADMIN
} from '../../event/performance-bonds/roles'
import {accessControlRevertMessageMissingGlobalRole} from '../../event/performance-bonds/access-control-messages'
import {
    ExpectedAddBondEvent,
    verifyAddPerformanceBondEvents,
    verifyAddPerformanceBondLogEvents
} from '../../event/performance-bonds/verify-performance-bond-curator-events'
import {createPerformanceBondEvents} from '../../event/performance-bonds/performance-bond-creator-events'

// Wires up Waffle with Chai
chai.use(solidity)

const INVALID_DAO_ID = 0n
const DAO_ID = 1n
const REDEMPTION_REASON = 'test redemption reason string'
const BOND_SLASH_REASON = 'example slash reason'

describe('Performance Bond Curator contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        nonBondAdmin = await signer(1)
        treasury = (await signer(2)).address
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        otherCollateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        creator = await deployContract<PerformanceBondFactory>(
            'PerformanceBondFactory',
            treasury
        )
        curator = await deployContract<BondCuratorBox>('BondCuratorBox')
        await successfulTransaction(curator.initialize())
    })

    describe('add performance bond', () => {
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
            const beforeCountOther = await curator.performanceBondCount(
                INVALID_DAO_ID
            )
            const beforeCountChosen = await curator.performanceBondCount(DAO_ID)
            const bond = await createBond()
            await successfulTransaction(curator.addBond(DAO_ID, bond.address))

            expect(await curator.performanceBondCount(DAO_ID)).equals(
                beforeCountChosen.add(1n)
            )
            expect(await curator.performanceBondCount(INVALID_DAO_ID)).equals(
                beforeCountOther
            )
        })

        it('when valid', async () => {
            const bond = await createBond()

            const receipt = await successfulTransaction(
                curator.addBond(DAO_ID, bond.address)
            )

            const createdBondIndex = await curator.performanceBondCount(DAO_ID)
            expect(
                await curator.performanceBondAt(
                    DAO_ID,
                    createdBondIndex.sub(1n)
                )
            ).equals(bond.address)

            const expectedAddBondEvents: ExpectedAddBondEvent[] = [
                {bond: bond.address, instigator: admin}
            ]
            verifyAddPerformanceBondEvents(receipt, expectedAddBondEvents)
            verifyAddPerformanceBondLogEvents(
                curator,
                receipt,
                expectedAddBondEvents
            )
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

    describe('performance bond', () => {
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
                    curator.performanceBondAllowRedemption(
                        DAO_ID,
                        bond.address,
                        REDEMPTION_REASON
                    )
                )

                expect(await bond.redeemable()).is.true
            })

            it('only when managing', async () => {
                await expect(
                    curator.performanceBondAllowRedemption(
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
                        .performanceBondAllowRedemption(
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
                    curator.performanceBondAllowRedemption(
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
                    curator.performanceBondPause(DAO_ID, bond.address)
                )

                expect(await bond.paused()).is.true
            })

            it('only when managing', async () => {
                await expect(
                    curator.performanceBondPause(DAO_ID, bond.address)
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao admin role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .performanceBondPause(DAO_ID, bond.address)
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
                    curator.performanceBondPause(DAO_ID, bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('slash', () => {
            it('delegates', async () => {
                await successfulTransaction(
                    curator.addBond(DAO_ID, bond.address)
                )

                await expect(
                    curator.performanceBondSlash(
                        DAO_ID,
                        bond.address,
                        77n,
                        BOND_SLASH_REASON
                    )
                ).to.be.revertedWith('Bond: too large')
            })

            it('only when managing', async () => {
                await expect(
                    curator.performanceBondSlash(
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
                        .performanceBondSlash(
                            DAO_ID,
                            bond.address,
                            5n,
                            BOND_SLASH_REASON
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
                    curator.performanceBondSlash(
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
                    curator.performanceBondSetMetaData(
                        DAO_ID,
                        bond.address,
                        'new meta data'
                    )
                )

                expect(await bond.metaData()).equals('new meta data')
            })

            it('only when managing', async () => {
                await expect(
                    curator.performanceBondSetMetaData(
                        DAO_ID,
                        bond.address,
                        'meta'
                    )
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao meeple role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .performanceBondSetMetaData(
                            DAO_ID,
                            bond.address,
                            'meta'
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
                    curator.performanceBondSetMetaData(
                        DAO_ID,
                        bond.address,
                        'data'
                    )
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
                    curator.performanceBondSetTreasury(
                        DAO_ID,
                        bond.address,
                        curator.address
                    )
                )

                expect(await bond.treasury()).equals(curator.address)
            })

            it('only when managing', async () => {
                await expect(
                    curator.performanceBondSetTreasury(
                        DAO_ID,
                        bond.address,
                        bond.address
                    )
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao admin role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .performanceBondSetTreasury(
                            DAO_ID,
                            bond.address,
                            bond.address
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
                    curator.performanceBondSetTreasury(
                        DAO_ID,
                        bond.address,
                        bond.address
                    )
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
                    curator.performanceBondSweepERC20Tokens(
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
                        .performanceBondSweepERC20Tokens(
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
                    curator.performanceBondSweepERC20Tokens(
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
                    curator.performanceBondPause(DAO_ID, bond.address)
                )
                expect(await bond.paused()).is.true

                await successfulTransaction(
                    curator.performanceBondUnpause(DAO_ID, bond.address)
                )

                expect(await bond.paused()).is.false
            })

            it('only when managing', async () => {
                await expect(
                    curator.performanceBondUnpause(DAO_ID, bond.address)
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao admin role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .performanceBondUnpause(DAO_ID, bond.address)
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
                    curator.performanceBondUnpause(DAO_ID, bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('withdraw collateral', () => {
            it('delegates', async () => {
                await successfulTransaction(
                    curator.addBond(DAO_ID, bond.address)
                )

                await expect(
                    curator.performanceBondWithdrawCollateral(
                        DAO_ID,
                        bond.address
                    )
                ).to.be.revertedWith('whenRedeemable: not redeemable')
            })

            it('only when managing', async () => {
                await expect(
                    curator.performanceBondWithdrawCollateral(
                        DAO_ID,
                        bond.address
                    )
                ).to.be.revertedWith('BondCurator: not managing')
            })

            it('at least dao admin role', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .performanceBondWithdrawCollateral(DAO_ID, bond.address)
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
                    curator.performanceBondWithdrawCollateral(
                        DAO_ID,
                        bond.address
                    )
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
            creator.createPerformanceBond(
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

        const creationEvent = createPerformanceBondEvents(
            events('CreatePerformanceBond', receipt)
        )[0]
        const bond = await erc20SingleCollateralPerformanceBondContractAt(
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
    let creator: PerformanceBondFactory
})
