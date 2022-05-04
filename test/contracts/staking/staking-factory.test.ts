// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    StakingPoolFactory,
    ERC20PresetMinterPauser,
    BondMediator,
    IERC20,
    BitDAO
} from '../../../typechain-types'
import {
    deployContract,
    deployContractWithProxy,
    signer
} from '../../framework/contracts'
import {getTimestampNow} from '../../framework/time'
import {BigNumber} from 'ethers'

import {RewardType} from '../../event/staking/staking-events'
import {
    verifyStakingPoolCreated,
    verifyStakingPoolCreatedLogEvents
} from '../../event/staking/verify-staking-factory-events'
import {successfulTransaction} from '../../framework/transaction'
import {
    ExpectedBeneficiaryUpdateEvent,
    verifyBeneficiaryUpdateEvents,
    verifyBeneficiaryUpdateLogEvents
} from '../../event/sweep/verify-token-sweep-events'
import {accessControlRevertMessageMissingGlobalRole} from '../../event/bond/access-control-messages'
import {SUPER_USER} from '../../event/bond/roles'
import {
    ExpectedERC20SweepEvent,
    verifyERC20SweepEvents,
    verifyERC20SweepLogEvents
} from '../../event/sweep/verify-sweep-erc20-events'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'

// Wires up Waffle with Chai
chai.use(solidity)

const EPOCH_DURATION = 60
const START_DELAY = 15
const REWARDS_AVAILABLE_OFFSET = 20
const MIN_POOL_STAKE = 500

export type StakingPoolLibData = {
    stakeToken: string
    rewardType: number
    rewardTokens: never[]
    minimumContribution: BigNumber
    epochDuration: BigNumber
    epochStartTimestamp: BigNumber
    treasury: string
    daoId: number
    minTotalPoolStake: number
    maxTotalPoolStake: number
}

describe.only('Staking Pool Factory', () => {
    before(async () => {
        admin = (await signer(0)).address
        nonAdmin = await signer(3)
        treasury = (await signer(2)).address
        const symbol = 'EEK'
        stakeTokens = await deployContract<ERC20PresetMinterPauser>(
            'ERC20PresetMinterPauser',
            'Another erc20 Token',
            symbol
        )
        stakingPoolFactory = await deployContract('StakingPoolFactory')
        await stakingPoolFactory.initialize(treasury)
        epochStartTimestamp = BigNumber.from(
            (await getTimestampNow()) + START_DELAY
        )
        rewardsAvailableTimestamp = epochStartTimestamp
            .add(REWARDS_AVAILABLE_OFFSET)
            .add(EPOCH_DURATION)
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
    })

    describe('ERC20 token sweep', () => {
        it('init', async () => {
            const stakingPoolFactory = await deployContract<StakingPoolFactory>(
                'StakingPoolFactory'
            )

            const receipt = await successfulTransaction(
                stakingPoolFactory.initialize(treasury)
            )

            expect(await stakingPoolFactory.tokenSweepBeneficiary()).equals(
                treasury
            )
            const expectedEvents = [{beneficiary: treasury, instigator: admin}]
            verifyBeneficiaryUpdateEvents(receipt, expectedEvents)
            verifyBeneficiaryUpdateLogEvents(
                stakingPoolFactory,
                receipt,
                expectedEvents
            )
        })

        describe('update beneficiary', () => {
            it('side effects', async () => {
                expect(await stakingPoolFactory.tokenSweepBeneficiary()).equals(
                    treasury
                )

                const receipt = await successfulTransaction(
                    stakingPoolFactory.updateTokenSweepBeneficiary(
                        nonAdmin.address
                    )
                )

                expect(await stakingPoolFactory.tokenSweepBeneficiary()).equals(
                    nonAdmin.address
                )
                const expectedEvents: ExpectedBeneficiaryUpdateEvent[] = [
                    {
                        beneficiary: nonAdmin.address,
                        instigator: admin
                    }
                ]
                verifyBeneficiaryUpdateEvents(receipt, expectedEvents)
                verifyBeneficiaryUpdateLogEvents(
                    stakingPoolFactory,
                    receipt,
                    expectedEvents
                )
            })

            it('only Super User', async () => {
                await expect(
                    stakingPoolFactory
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
                await stakingPoolFactory.pause()

                await expect(
                    stakingPoolFactory.updateTokenSweepBeneficiary(
                        nonAdmin.address
                    )
                ).to.be.revertedWith('Pausable: paused')
            })
            after(async () => {
                await stakingPoolFactory.unpause()
                await stakingPoolFactory.updateTokenSweepBeneficiary(treasury)
            })
        })

        describe('ERC20 token sweep', () => {
            it('side effects', async () => {
                const seedFunds = 100n
                const sweepAmount = 55n
                await successfulTransaction(
                    collateralTokens.transfer(
                        stakingPoolFactory.address,
                        seedFunds
                    )
                )
                expect(
                    await collateralTokens.balanceOf(stakingPoolFactory.address)
                ).equals(seedFunds)
                expect(await collateralTokens.balanceOf(treasury)).equals(0)

                const receipt = await successfulTransaction(
                    stakingPoolFactory.sweepERC20Tokens(
                        collateralTokens.address,
                        sweepAmount
                    )
                )

                expect(
                    await collateralTokens.balanceOf(stakingPoolFactory.address)
                ).equals(seedFunds - sweepAmount)
                expect(await collateralTokens.balanceOf(treasury)).equals(
                    sweepAmount
                )
                const expectedEvents: ExpectedERC20SweepEvent[] = [
                    {
                        beneficiary: treasury,
                        tokens: collateralTokens.address,
                        amount: sweepAmount,
                        instigator: admin
                    }
                ]
                verifyERC20SweepEvents(receipt, expectedEvents)
                verifyERC20SweepLogEvents(
                    stakingPoolFactory,
                    receipt,
                    expectedEvents
                )
            })

            it('only Super User', async () => {
                await expect(
                    stakingPoolFactory
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
                await stakingPoolFactory.pause()

                await expect(
                    stakingPoolFactory.sweepERC20Tokens(
                        collateralTokens.address,
                        5
                    )
                ).to.be.revertedWith('Pausable: paused')
            })
        })
        after(async () => {
            await stakingPoolFactory.unpause()
        })
    })

    describe('create pools', () => {
        before(async () => {
            epochStartTimestamp = BigNumber.from(
                (await getTimestampNow()) + START_DELAY
            )
        })

        it('create floating pool', async () => {
            const stakingPoolEventData = {
                stakeToken: stakeTokens.address,
                rewardType: RewardType.FLOATING,
                rewardTokens: [],
                minimumContribution: BigNumber.from(5),
                epochDuration: BigNumber.from(EPOCH_DURATION),
                epochStartTimestamp,
                treasury: admin
            }

            stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                ...stakingPoolEventData
            }

            const stakingPoolEvent = {
                creator: admin,
                ...stakingPoolEventData
            }

            verifyStakingPoolCreated(
                stakingPoolEvent,
                await successfulTransaction(
                    stakingPoolFactory.createStakingPool(
                        stakingPoolInfo,
                        false,
                        rewardsAvailableTimestamp
                    )
                )
            )
            verifyStakingPoolCreatedLogEvents(
                stakingPoolFactory,
                await successfulTransaction(
                    stakingPoolFactory.createStakingPool(
                        stakingPoolInfo,
                        false,
                        rewardsAvailableTimestamp
                    )
                ),
                [stakingPoolEvent]
            )
        })

        it('paused cannot create pool', async () => {
            await stakingPoolFactory.pause()
            await expect(
                stakingPoolFactory.createStakingPool(
                    stakingPoolInfo,
                    false,
                    rewardsAvailableTimestamp
                )
            ).to.be.revertedWith('Pausable: paused')
            await stakingPoolFactory.unpause()
        })

        it('create fixed pool', async () => {
            const stakingPoolEventData = {
                stakeToken: stakeTokens.address,
                rewardType: RewardType.FIXED,
                rewardTokens: [],
                minimumContribution: BigNumber.from(5),
                epochDuration: BigNumber.from(EPOCH_DURATION),
                epochStartTimestamp,
                treasury: admin
            }

            stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                ...stakingPoolEventData
            }

            const stakingPoolEvent = {
                creator: admin,
                ...stakingPoolEventData
            }
            verifyStakingPoolCreated(
                stakingPoolEvent,
                await successfulTransaction(
                    stakingPoolFactory.createStakingPool(
                        stakingPoolInfo,
                        false,
                        rewardsAvailableTimestamp
                    )
                )
            )
        })
    })
    let stakingPoolInfo: StakingPoolLibData
    let epochStartTimestamp: BigNumber
    let rewardsAvailableTimestamp: BigNumber
    let admin: string
    let stakingPoolFactory: StakingPoolFactory
    let stakeTokens: ERC20PresetMinterPauser
    let treasury: string
    let collateralTokens: IERC20
    let nonAdmin: SignerWithAddress
})
