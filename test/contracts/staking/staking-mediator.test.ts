// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    BitDAO,
    ERC20,
    ERC20PresetMinterPauser,
    IERC20,
    StakingPoolFactory,
    StakingPoolMediator
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
} from '../../event/performance-bonds/roles'
import {successfulTransaction} from '../../framework/transaction'
import {BigNumber} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {events} from '../../framework/events'
import {accessControlRevertMessageMissingGlobalRole} from '../../event/performance-bonds/access-control-messages'
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
import {
    ExpectCreateDaoEvent,
    verifyCreateDaoEvents,
    verifyCreateDaoLogEvents
} from '../../event/performance-bonds/verify-performance-bond-mediator-events'
import {createDaoEvents} from '../../event/performance-bonds/performance-bond-mediator-events'
import {RewardType} from '../../event/staking/staking-events'
import {getTimestampNow} from '../../framework/time'
import {verifyStakingPoolCreatedLogEvents} from '../../event/staking/verify-staking-factory-events'
import {verifyStakingPoolCreatorUpdateLogEvents} from '../../event/staking/verify-staking-mediator-events'

// Wires up Waffle with Chai
chai.use(solidity)

const INVALID_DAO_ID = 0n

describe('Staking Pool Mediator contract', () => {
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
        creator = await deployContract<StakingPoolFactory>(
            'StakingPoolFactory',
            treasury
        )
        mediator = await deployContractWithProxy<StakingPoolMediator>(
            'StakingPoolMediator',
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
    })

    describe('DAO', () => {
        describe('create', () => {
            it('by Super User role', async () => {
                const previousHighestDaoId = await mediator.highestDaoId()
                const expectedDaoId = previousHighestDaoId.add(1).toBigInt()

                const receipt = await successfulTransaction(
                    mediator.createDao(treasury)
                )
                const expectedCreateDaoEvent: ExpectCreateDaoEvent[] = [
                    {
                        id: expectedDaoId,
                        treasury: treasury,
                        instigator: superUser
                    }
                ]

                verifyCreateDaoEvents(receipt, expectedCreateDaoEvent)
                verifyCreateDaoLogEvents(
                    mediator,
                    receipt,
                    expectedCreateDaoEvent
                )

                const id = await mediator.highestDaoId()
                expect(id).to.equal(expectedDaoId)
                expect(await mediator.hasDaoRole(id, DAO_ADMIN.hex, superUser))
                    .to.be.false
            })

            it('by Dao Creator role', async () => {
                const previousHighestDaoId = await mediator.highestDaoId()
                const expectedDaoId = previousHighestDaoId.add(1).toBigInt()

                const receipt = await successfulTransaction(
                    mediator.connect(daoCreator).createDao(treasury)
                )
                const expectedCreateDaoEvent: ExpectCreateDaoEvent[] = [
                    {
                        id: expectedDaoId,
                        treasury: treasury,
                        instigator: daoCreator.address
                    }
                ]

                verifyCreateDaoEvents(receipt, expectedCreateDaoEvent)
                verifyCreateDaoLogEvents(
                    mediator,
                    receipt,
                    expectedCreateDaoEvent
                )

                const id = await mediator.highestDaoId()
                expect(id).to.equal(expectedDaoId)
                expect(
                    await mediator.hasDaoRole(
                        id,
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

        describe('treasury', () => {
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

                it('side effect', async () => {
                    expect(await mediator.daoTreasury(daoId)).equals(treasury)

                    await successfulTransaction(
                        mediator.setDaoTreasury(daoId, collateralTokens.address)
                    )

                    expect(await mediator.daoTreasury(daoId)).equals(
                        collateralTokens.address
                    )
                })

                it('at least dao admin role', async () => {
                    await expect(
                        mediator
                            .connect(nonAdmin)
                            .setDaoTreasury(daoId, treasury)
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

        describe('meta data', () => {
            describe('retrieve', () => {
                it(' by anyone', async () => {
                    expect(
                        await mediator.connect(nonAdmin).daoMetaData(daoId)
                    ).equals('')
                })
            })

            describe('update', () => {
                after(async () => {
                    if (await mediator.paused()) {
                        await mediator.unpause()
                    }
                })

                it('side effect', async () => {
                    const update = 'a new value'
                    expect(await mediator.daoMetaData(daoId)).equals('')

                    await successfulTransaction(
                        mediator.setDaoMetaData(daoId, update)
                    )

                    expect(await mediator.daoMetaData(daoId)).equals(update)
                })

                it('at least dao admin role', async () => {
                    await expect(
                        mediator
                            .connect(nonAdmin)
                            .setDaoMetaData(daoId, 'updated value')
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
                        mediator.setDaoMetaData(daoId, 'updated value')
                    ).to.be.revertedWith('Pausable: paused')
                })
            })
        })
    })

    describe('managed staking pool', () => {
        after(async () => {
            if (await mediator.paused()) {
                await mediator.unpause()
            }
        })
        describe('create', () => {
            it('non-whitelisted collateral', async () => {
                const epochStartTimestamp =
                    (await getTimestampNow()) + START_DELAY
                const stakingPoolInfo = {
                    daoId,
                    minTotalPoolStake: MIN_POOL_STAKE,
                    maxTotalPoolStake: 600,
                    minimumContribution: 5,
                    epochDuration: EPOCH_DURATION,
                    epochStartTimestamp,
                    emergencyMode: false,
                    treasury,
                    stakeToken: nonWhitelistCollateralTokens.address,
                    rewardType: RewardType.FLOATING,
                    rewardTokens: []
                }

                await expect(
                    mediator.createManagedStakingPool(
                        stakingPoolInfo,
                        false,
                        epochStartTimestamp
                    )
                ).to.be.revertedWith('SPM: collateral not whitelisted')
            })

            it('invalid DAO id', async () => {
                const epochStartTimestamp =
                    (await getTimestampNow()) + START_DELAY
                const stakingPoolInfo = {
                    daoId: INVALID_DAO_ID,
                    minTotalPoolStake: MIN_POOL_STAKE,
                    maxTotalPoolStake: 600,
                    minimumContribution: 5,
                    epochDuration: EPOCH_DURATION,
                    epochStartTimestamp,
                    emergencyMode: false,
                    treasury,
                    stakeToken: collateralTokens.address,
                    rewardType: RewardType.FLOATING,
                    rewardTokens: []
                }
                await expect(
                    mediator.createManagedStakingPool(
                        stakingPoolInfo,
                        false,
                        epochStartTimestamp
                    )
                ).to.be.revertedWith('SPM: invalid DAO Id')
            })

            it('at least dao meeple role', async () => {
                const epochStartTimestamp =
                    (await getTimestampNow()) + START_DELAY
                const stakingPoolInfo = {
                    daoId,
                    minTotalPoolStake: MIN_POOL_STAKE,
                    maxTotalPoolStake: 600,
                    minimumContribution: 5,
                    epochDuration: EPOCH_DURATION,
                    epochStartTimestamp,
                    emergencyMode: false,
                    treasury,
                    stakeToken: nonWhitelistCollateralTokens.address,
                    rewardType: RewardType.FLOATING,
                    rewardTokens: []
                }

                await expect(
                    mediator
                        .connect(nonAdmin)
                        .createManagedStakingPool(
                            stakingPoolInfo,
                            false,
                            epochStartTimestamp
                        )
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonAdmin,
                        DAO_MEEPLE
                    )
                )
            })

            it('whitelisted collateral', async () => {
                const epochStartTimestamp =
                    (await getTimestampNow()) + START_DELAY
                const stakingPoolInfo = {
                    daoId,
                    minTotalPoolStake: MIN_POOL_STAKE,
                    maxTotalPoolStake: 600,
                    minimumContribution: BigNumber.from(5),
                    epochDuration: BigNumber.from(EPOCH_DURATION),
                    epochStartTimestamp: BigNumber.from(epochStartTimestamp),
                    emergencyMode: false,
                    treasury,
                    stakeToken: collateralTokens.address,
                    rewardType: RewardType.FLOATING,
                    rewardTokens: []
                }
                const stakingPoolEvent = {
                    creator: mediator.address,
                    ...stakingPoolInfo
                }
                const rewardsAvailableTimestamp =
                    REWARDS_AVAILABLE_OFFSET +
                    epochStartTimestamp +
                    EPOCH_DURATION
                const receipt = await successfulTransaction(
                    mediator.createManagedStakingPool(
                        stakingPoolInfo,
                        false,
                        rewardsAvailableTimestamp
                    )
                )
                verifyStakingPoolCreatedLogEvents(creator, receipt, [
                    stakingPoolEvent
                ])
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                const epochStartTimestamp =
                    (await getTimestampNow()) + START_DELAY
                const stakingPoolInfo = {
                    daoId,
                    minTotalPoolStake: MIN_POOL_STAKE,
                    maxTotalPoolStake: 600,
                    minimumContribution: 5,
                    epochDuration: EPOCH_DURATION,
                    epochStartTimestamp,
                    emergencyMode: false,
                    treasury,
                    stakeToken: nonWhitelistCollateralTokens.address,
                    rewardType: RewardType.FLOATING,
                    rewardTokens: []
                }

                await expect(
                    mediator.createManagedStakingPool(
                        stakingPoolInfo,
                        false,
                        epochStartTimestamp
                    )
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
            const stakingPoolMediator =
                await deployContract<StakingPoolMediator>('StakingPoolMediator')

            const receipt = await successfulTransaction(
                stakingPoolMediator.initialize(creator.address, treasury)
            )

            expect(await stakingPoolMediator.tokenSweepBeneficiary()).equals(
                treasury
            )
            const expectedEvents = [
                {beneficiary: treasury, instigator: superUser}
            ]
            verifyBeneficiaryUpdateEvents(receipt, expectedEvents)
            verifyBeneficiaryUpdateLogEvents(
                stakingPoolMediator,
                receipt,
                expectedEvents
            )
        })

        describe('update beneficiary', () => {
            after(async () => {
                mediator = await deployContractWithProxy<StakingPoolMediator>(
                    'StakingPoolMediator',
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
                mediator = await deployContractWithProxy<StakingPoolMediator>(
                    'StakingPoolMediator',
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

        describe('creator', () => {
            it('is a contract', async () => {
                await expect(
                    mediator.setStakingPoolCreator(treasury)
                ).to.be.revertedWith('SPM: creator not a contract')
            })

            it('not identity operation', async () => {
                await expect(
                    mediator.setStakingPoolCreator(creator.address)
                ).to.be.revertedWith('SPM: matches existing')
            })

            it('at least system admin role', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .setStakingPoolCreator(creator.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        nonAdmin,
                        SYSTEM_ADMIN
                    )
                )
            })

            it('updates', async () => {
                expect(await mediator.stakingPoolCreator()).equals(
                    creator.address
                )

                const receipt = await successfulTransaction(
                    mediator.setStakingPoolCreator(collateralTokens.address)
                )

                expect(await mediator.stakingPoolCreator()).equals(
                    collateralTokens.address
                )

                const expectedEvent = [
                    {
                        instigator: superUser,
                        previousCreator: creator.address,
                        updateCreator: collateralTokens.address
                    }
                ]

                verifyStakingPoolCreatorUpdateLogEvents(
                    mediator,
                    receipt,
                    expectedEvent
                )
            })

            it('only when not paused', async () => {
                await mediator.pause()

                await expect(
                    mediator.setStakingPoolCreator(creator.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })
    })

    let superUser: string
    let daoCreator: SignerWithAddress
    let treasury: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: IERC20
    let nonWhitelistCollateralTokens: IERC20
    let mediator: StakingPoolMediator
    let creator: StakingPoolFactory
    let daoId: bigint
    const EPOCH_DURATION = 60 // time the lockup lasts
    const START_DELAY = 15 // offset time in seconds before the lockup period starts
    const REWARDS_AVAILABLE_OFFSET = 20 // time after the end of the lockup the rewards are available
    const MIN_POOL_STAKE = 500
})

async function createDao(
    mediator: StakingPoolMediator,
    treasury: string
): Promise<bigint> {
    const receipt = await successfulTransaction(mediator.createDao(treasury))

    const creationEvents = createDaoEvents(events('CreateDao', receipt))

    expect(creationEvents).is.not.undefined
    expect(creationEvents).has.length(1)

    return creationEvents[0].id.toBigInt()
}
