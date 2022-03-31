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
    BondMediator,
    ERC20,
    ERC20PresetMinterPauser
} from '../../../typechain-types'
import {
    deployContract,
    deployContractWithProxy,
    signer
} from '../../framework/contracts'
import {
    DAO_ADMIN,
    DAO_CREATOR,
    DAO_MEEPLE,
    SUPER_USER,
    SYSTEM_ADMIN
} from '../../event/bond/roles'
import {successfulTransaction} from '../../framework/transaction'
import {eventLog} from '../../framework/event-logs'
import {erc20SingleCollateralBondContractAt} from '../../event/bond/single-collateral-bond-contract'
import {constants} from 'ethers'
import {verifyOwnershipTransferredEventLogs} from '../../event/ownable/verify-ownable-event'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ExtendedERC20} from '../../cast/extended-erc20'
import {createDaoEvents} from '../../event/bond/bond-portal-events'
import {events} from '../../framework/events'
import {createBondEventLogs} from '../../event/bond/bond-creator-events'
import {accessControlRevertMessageMissingGlobalRole} from '../../event/bond/access-control-messages'
import {
    ExpectedBeneficiaryUpdateEvent,
    verifyBeneficiaryUpdateEvents,
    verifyBeneficiaryUpdateLogEvents
} from '../../event/sweep/verify-token-sweep-events'
import {
    ExpectedERC20SweepEvent,
    verifyERC20SweepEvents,
    verifyERC20SweepLogEvents
} from '../../event/sweep/verify-sweep-erc20-events'

// Wires up Waffle with Chai
chai.use(solidity)

const INVALID_DAO_ID = 0n

describe('Bond Mediator contract', () => {
    before(async () => {
        superUser = (await signer(0)).address
        daoCreator = await signer(1)
        treasury = (await signer(2)).address
        nonAdmin = await signer(3)
        collateralTokens = await deployContract<BitDAO>('BitDAO', superUser)
        nonWhitelistCollateralTokens = await deployContract<ERC20>(
            '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
            'Name',
            'SYMBOL'
        )
        creator = await deployContract<BondFactory>('BondFactory')
        await successfulTransaction(creator.initialize(treasury))
        mediator = await deployContractWithProxy<BondMediator>(
            'BondMediator',
            creator.address,
            treasury
        )

        await mediator.grantDaoCreatorRole(daoCreator.address)

        daoId = await createDao(mediator, treasury)
        await mediator.whitelistCollateral(daoId, collateralTokens.address)
    })

    describe('collateral whitelist', () => {
        describe('add', () => {
            after(async () => {
                if (await mediator.paused()) {
                    await mediator.unpause()
                }
            })
            it('at least dao admin role', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .whitelistCollateral(daoId, collateralTokens.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonAdmin,
                        DAO_ADMIN
                    )
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                const symbol = 'EEK'
                const tokens = await deployContract<ERC20PresetMinterPauser>(
                    'ERC20PresetMinterPauser',
                    'Another erc20 Token',
                    symbol
                )
                expect(await tokens.symbol()).equals(symbol)

                await expect(
                    mediator.whitelistCollateral(daoId, tokens.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('remove', () => {
            after(async () => {
                if (await mediator.paused()) {
                    await mediator.unpause()
                }
                if (
                    !(await mediator.isAllowedDaoCollateral(
                        daoId,
                        collateralTokens.address
                    ))
                ) {
                    await mediator.whitelistCollateral(
                        daoId,
                        collateralTokens.address
                    )
                }
            })

            it('at least dao admin role', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .removeWhitelistedCollateral(
                            daoId,
                            collateralTokens.address
                        )
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonAdmin,
                        DAO_ADMIN
                    )
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                await expect(
                    mediator.removeWhitelistedCollateral(
                        daoId,
                        collateralTokens.address
                    )
                ).to.be.revertedWith('Pausable: paused')
            })
        })
    })

    describe('DAO', () => {
        describe('create', () => {
            it('by Super User role', async () => {
                const previousHighestDaoId = await mediator.highestDaoId()

                const receipt = await successfulTransaction(
                    mediator.createDao(treasury)
                )

                const creationEvents = createDaoEvents(
                    events('CreateDao', receipt)
                )
                expect(creationEvents).is.not.undefined
                expect(creationEvents).has.length(1)
                const daoId = creationEvents[0].id

                expect(daoId).to.equal(await mediator.highestDaoId())
                expect(daoId).to.equal(previousHighestDaoId.add(1))
                expect(
                    await mediator.hasDaoRole(daoId, DAO_ADMIN.hex, superUser)
                ).to.be.false
            })

            it('by Dao Creator role', async () => {
                const previousHighestDaoId = await mediator.highestDaoId()

                const receipt = await successfulTransaction(
                    mediator.connect(daoCreator).createDao(treasury)
                )

                const creationEvents = createDaoEvents(
                    events('CreateDao', receipt)
                )
                expect(creationEvents).is.not.undefined
                expect(creationEvents).has.length(1)
                const daoId = creationEvents[0].id

                expect(daoId).to.equal(await mediator.highestDaoId())
                expect(daoId).to.equal(previousHighestDaoId.add(1))
                expect(
                    await mediator.hasDaoRole(
                        daoId,
                        DAO_ADMIN.hex,
                        daoCreator.address
                    )
                ).to.be.true
            })

            it('has access control', async () => {
                await expect(
                    mediator.connect(nonAdmin).createDao(treasury)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonAdmin,
                        DAO_CREATOR
                    )
                )
            })
        })
    })

    describe('managed bond', () => {
        after(async () => {
            if (await mediator.paused()) {
                await mediator.unpause()
            }
        })
        describe('create', () => {
            it('non-whitelisted collateral', async () => {
                await expect(
                    mediator.createManagedBond(
                        daoId,
                        {
                            name: 'Named bond',
                            symbol: 'AA00AA',
                            data: ''
                        },
                        {
                            collateralTokens:
                                nonWhitelistCollateralTokens.address,
                            debtTokenAmount: 101n,
                            expiryTimestamp: 0n,
                            minimumDeposit: 0n
                        },
                        []
                    )
                ).to.be.revertedWith('BM: collateral not whitelisted')
            })

            it('invalid DAO id', async () => {
                await expect(
                    mediator.createManagedBond(
                        INVALID_DAO_ID,
                        {
                            name: 'Named bond',
                            symbol: 'AA00AA',
                            data: ''
                        },
                        {
                            collateralTokens:
                                nonWhitelistCollateralTokens.address,
                            debtTokenAmount: 201n,
                            expiryTimestamp: 0n,
                            minimumDeposit: 0n
                        },
                        []
                    )
                ).to.be.revertedWith('BM: invalid DAO Id')
            })

            it('at least dao meeple role', async () => {
                await expect(
                    mediator.connect(nonAdmin).createManagedBond(
                        daoId,
                        {
                            name: 'Named bond',
                            symbol: 'Bond Symbol',
                            data: ''
                        },
                        {
                            collateralTokens: collateralTokens.address,
                            debtTokenAmount: 1n,
                            expiryTimestamp: 0n,
                            minimumDeposit: 100n
                        },
                        []
                    )
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonAdmin,
                        DAO_MEEPLE
                    )
                )
            })

            it('whitelisted collateral', async () => {
                const bondName = 'A highly unique bond name'
                const bondSymbol = 'Bond Symbol'
                const debtTokens = 101n
                const expiryTimestamp = 9999n
                const minimumDeposit = 1n
                const metaData = 'meh'

                const receipt = await successfulTransaction(
                    mediator.createManagedBond(
                        daoId,
                        {
                            name: bondName,
                            symbol: bondSymbol,
                            data: metaData
                        },
                        {
                            collateralTokens: collateralTokens.address,
                            debtTokenAmount: debtTokens,
                            expiryTimestamp: expiryTimestamp,
                            minimumDeposit: minimumDeposit
                        },
                        []
                    )
                )

                const createBondEvents = createBondEventLogs(
                    eventLog('CreateBond', creator, receipt)
                )
                expect(createBondEvents.length).to.equal(1)

                const createdBondAddress = createBondEvents[0].bond
                expect(await mediator.bondCount(daoId)).equals(1)
                expect(await mediator.bondAt(daoId, 0)).equals(
                    createdBondAddress
                )

                const bond = await erc20SingleCollateralBondContractAt(
                    createdBondAddress
                )

                verifyOwnershipTransferredEventLogs(
                    [
                        {
                            previousOwner: constants.AddressZero,
                            newOwner: creator.address
                        },
                        {
                            previousOwner: creator.address,
                            newOwner: mediator.address
                        }
                    ],
                    bond,
                    receipt
                )

                expect(await bond.name()).equals(bondName)
                expect(await bond.symbol()).equals(bondSymbol)
                expect(await bond.debtTokens()).equals(debtTokens)
                expect(await bond.collateralTokens()).equals(
                    collateralTokens.address
                )
                expect(await bond.expiryTimestamp()).equals(expiryTimestamp)
                expect(await bond.minimumDeposit()).equals(minimumDeposit)
                expect(await bond.metaData()).equals(metaData)
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                await expect(
                    mediator.createManagedBond(
                        daoId,
                        {
                            name: 'Named bond',
                            symbol: 'Bond Symbol',
                            data: ''
                        },
                        {
                            collateralTokens: collateralTokens.address,
                            debtTokenAmount: 5n,
                            expiryTimestamp: 2n,
                            minimumDeposit: 70n
                        },
                        []
                    )
                ).to.be.revertedWith('Pausable: paused')
            })
        })
    })

    describe('DAO treasury', () => {
        describe('retrieve', () => {
            it(' by anyone', async () => {
                expect(
                    await mediator.connect(nonAdmin).daoTreasury(daoId)
                ).equals(treasury)
            })
        })

        describe('update', () => {
            after(async () => {
                if (await mediator.paused()) {
                    await mediator.unpause()
                }
            })

            it('at least dao admin role', async () => {
                await expect(
                    mediator.connect(nonAdmin).setDaoTreasury(daoId, treasury)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonAdmin,
                        DAO_ADMIN
                    )
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                await expect(
                    mediator.setDaoTreasury(daoId, treasury)
                ).to.be.revertedWith('Pausable: paused')
            })
        })
    })

    describe('pause', () => {
        after(async () => {
            if (await mediator.paused()) {
                await mediator.unpause()
            }
        })

        it('at least system admin role', async () => {
            await expect(mediator.connect(nonAdmin).pause()).to.be.revertedWith(
                accessControlRevertMessageMissingGlobalRole(
                    nonAdmin,
                    SYSTEM_ADMIN
                )
            )
        })

        it('changes state', async () => {
            expect(await mediator.paused()).is.false

            await mediator.pause()

            expect(await mediator.paused()).is.true
        })

        it('only when not paused', async () => {
            await expect(mediator.pause()).to.be.revertedWith(
                'Pausable: paused'
            )
        })
    })

    describe('ERC20 token sweep', () => {
        it('init', async () => {
            const bondMediator = await deployContract<BondMediator>(
                'BondMediator'
            )

            const receipt = await successfulTransaction(
                bondMediator.initialize(creator.address, treasury)
            )

            expect(await bondMediator.tokenSweepBeneficiary()).equals(treasury)
            const expectedEvents = [
                {beneficiary: treasury, instigator: superUser}
            ]
            verifyBeneficiaryUpdateEvents(receipt, expectedEvents)
            verifyBeneficiaryUpdateLogEvents(
                bondMediator,
                receipt,
                expectedEvents
            )
        })

        describe('update beneficiary', () => {
            after(async () => {
                mediator = await deployContractWithProxy<BondMediator>(
                    'BondMediator',
                    creator.address,
                    treasury
                )
            })

            it('side effects', async () => {
                expect(await mediator.tokenSweepBeneficiary()).equals(treasury)

                const receipt = await successfulTransaction(
                    mediator.updateTokenSweepBeneficiary(nonAdmin.address)
                )

                expect(await mediator.tokenSweepBeneficiary()).equals(
                    nonAdmin.address
                )
                const expectedEvents: ExpectedBeneficiaryUpdateEvent[] = [
                    {
                        beneficiary: nonAdmin.address,
                        instigator: superUser
                    }
                ]
                verifyBeneficiaryUpdateEvents(receipt, expectedEvents)
                verifyBeneficiaryUpdateLogEvents(
                    mediator,
                    receipt,
                    expectedEvents
                )
            })

            it('only Super User', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .updateTokenSweepBeneficiary(nonAdmin.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonAdmin,
                        SUPER_USER
                    )
                )
            })

            it('only when not paused', async () => {
                await mediator.pause()

                await expect(
                    mediator.updateTokenSweepBeneficiary(nonAdmin.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('ERC20 token sweep', () => {
            after(async () => {
                mediator = await deployContractWithProxy<BondMediator>(
                    'BondMediator',
                    creator.address,
                    treasury
                )
            })
            it('side effects', async () => {
                const seedFunds = 100n
                const sweepAmount = 55n
                await successfulTransaction(
                    collateralTokens.transfer(mediator.address, seedFunds)
                )
                expect(
                    await collateralTokens.balanceOf(mediator.address)
                ).equals(seedFunds)
                expect(await collateralTokens.balanceOf(treasury)).equals(0)

                const receipt = await successfulTransaction(
                    mediator.sweepERC20Tokens(
                        collateralTokens.address,
                        sweepAmount
                    )
                )

                expect(
                    await collateralTokens.balanceOf(mediator.address)
                ).equals(seedFunds - sweepAmount)
                expect(await collateralTokens.balanceOf(treasury)).equals(
                    sweepAmount
                )
                const expectedEvents: ExpectedERC20SweepEvent[] = [
                    {
                        beneficiary: treasury,
                        tokens: collateralTokens.address,
                        amount: sweepAmount,
                        instigator: superUser
                    }
                ]
                verifyERC20SweepEvents(receipt, expectedEvents)
                verifyERC20SweepLogEvents(mediator, receipt, expectedEvents)
            })

            it('only Super User', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .sweepERC20Tokens(collateralTokens.address, 5)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonAdmin,
                        SUPER_USER
                    )
                )
            })

            it('only when not paused', async () => {
                await mediator.pause()

                await expect(
                    mediator.sweepERC20Tokens(collateralTokens.address, 5)
                ).to.be.revertedWith('Pausable: paused')
            })
        })
    })

    describe('unpause', () => {
        before(async () => {
            if (await mediator.paused()) {
                await mediator.unpause()
            }
        })

        it('changes state', async () => {
            await mediator.pause()

            expect(await mediator.paused()).is.true

            await mediator.unpause()

            expect(await mediator.paused()).is.false
        })

        it('at least system admin role', async () => {
            await expect(mediator.connect(nonAdmin).pause()).to.be.revertedWith(
                accessControlRevertMessageMissingGlobalRole(
                    nonAdmin,
                    SYSTEM_ADMIN
                )
            )
        })

        it('only when paused', async () => {
            await expect(mediator.unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })
    })

    let superUser: string
    let daoCreator: SignerWithAddress
    let treasury: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ExtendedERC20
    let nonWhitelistCollateralTokens: ExtendedERC20
    let mediator: BondMediator
    let creator: BondFactory
    let daoId: bigint
})

async function createDao(
    mediator: BondMediator,
    treasury: string
): Promise<bigint> {
    const receipt = await successfulTransaction(mediator.createDao(treasury))

    const creationEvents = createDaoEvents(events('CreateDao', receipt))

    expect(creationEvents).is.not.undefined
    expect(creationEvents).has.length(1)

    return creationEvents[0].id.toBigInt()
}
