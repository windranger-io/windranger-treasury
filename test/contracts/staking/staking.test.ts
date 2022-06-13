// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    StakingPool,
    ERC20PresetMinterPauser,
    BitDAO,
    IERC20
} from '../../../typechain-types'
import {deployContract, signer} from '../../framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from '../../framework/transaction'
import {getTimestampNow, increaseTime} from '../../framework/time'
import {BigNumber, ContractReceipt} from 'ethers'

import {
    verifyDepositEvent,
    verifyInitializeRewardsEvent,
    verifyNoRewardsEvent,
    verifyWithdrawEvent,
    verifyWithdrawRewardsEvent
} from '../../event/staking/verify-staking-events'
import {RewardType} from '../../event/staking/staking-events'
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

// Wires up Waffle with Chai
chai.use(solidity)

const EPOCH_DURATION = 60 // time the lockup lasts
const START_DELAY = 15 // offset time in seconds before the lockup period starts
const REWARDS_AVAILABLE_OFFSET = 20 // time after the end of the lockup the rewards are available
const MIN_POOL_STAKE = 500
const REWARD_TOKEN_1_AMOUNT = 4000

describe('Staking Pool Tests', () => {
    describe('Initialization', () => {
        const ratio = 0
        const amount = BigNumber.from(9090)
        before(async () => {
            rewardToken1 = await deployContract<ERC20PresetMinterPauser>(
                'ERC20PresetMinterPauser',
                'Another erc20 Token',
                'SYM'
            )
        })
        it('launch paused then unpause', async () => {
            admin = (await signer(0)).address
            user = await signer(1)
            user2 = await signer(2)

            const symbol = 'EEK'
            stakeTokens = await deployContract<ERC20PresetMinterPauser>(
                'ERC20PresetMinterPauser',
                'Another erc20 Token',
                symbol
            )

            const epochStartTimestamp = (await getTimestampNow()) + START_DELAY
            const rewardsAvailableTimestamp =
                REWARDS_AVAILABLE_OFFSET + epochStartTimestamp + EPOCH_DURATION
            const stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                minimumContribution: 5,
                epochDuration: EPOCH_DURATION,
                epochStartTimestamp,
                emergencyMode: false,
                treasury: admin,
                stakeToken: stakeTokens.address,
                rewardType: RewardType.FLOATING,
                rewardTokens: []
            }

            stakingPool = await deployContract('StakingPool')

            await stakingPool.initialize(
                stakingPoolInfo,
                true,
                rewardsAvailableTimestamp,
                admin
            )

            await expect(
                userDeposit(user, BigNumber.from(20))
            ).to.be.revertedWith('Pausable: paused')

            await stakingPool.unpause()

            expect(await userDeposit(user, BigNumber.from(5)))
        })
        it('initialize rewards fails no allowance', async () => {
            await expect(
                stakingPool.initializeRewardTokens(admin, [
                    {
                        tokens: rewardToken1.address,
                        maxAmount: amount,
                        ratio: 0
                    }
                ])
            ).to.be.revertedWith('StakingPool: invalid allowance')
        })
        it('initialize rewards', async () => {
            await rewardToken1.mint(admin, amount)
            verifyInitializeRewardsEvent(
                {rewardTokens: rewardToken1.address, amount},
                await initializeRewards(rewardToken1, admin, amount, ratio)
            )
        })
    })

    describe('ERC20 token sweep', () => {
        let treasury: string
        let nonAdmin: SignerWithAddress
        let collateralTokens: IERC20
        before(async () => {
            treasury = (await signer(2)).address
            nonAdmin = await signer(3)
            collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        })
        it('init', async () => {
            stakingPool = await deployContract<StakingPool>('StakingPool')

            const epochStartTimestamp = (await getTimestampNow()) + START_DELAY
            const rewardsAvailableTimestamp =
                REWARDS_AVAILABLE_OFFSET + epochStartTimestamp + EPOCH_DURATION
            const stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                minimumContribution: 5,
                epochDuration: EPOCH_DURATION,
                epochStartTimestamp,
                emergencyMode: false,
                treasury: admin,
                stakeToken: stakeTokens.address,
                rewardType: RewardType.FLOATING,
                rewardTokens: []
            }

            const receipt = await successfulTransaction(
                stakingPool.initialize(
                    stakingPoolInfo,
                    false,
                    rewardsAvailableTimestamp,
                    treasury
                )
            )

            expect(await stakingPool.tokenSweepBeneficiary()).equals(treasury)
            const expectedEvents = [{beneficiary: treasury, instigator: admin}]
            verifyBeneficiaryUpdateEvents(receipt, expectedEvents)
            verifyBeneficiaryUpdateLogEvents(
                stakingPool,
                receipt,
                expectedEvents
            )
        })

        describe('update beneficiary', () => {
            it('side effects', async () => {
                expect(await stakingPool.tokenSweepBeneficiary()).equals(
                    treasury
                )

                const receipt = await successfulTransaction(
                    stakingPool.updateTokenSweepBeneficiary(nonAdmin.address)
                )

                expect(await stakingPool.tokenSweepBeneficiary()).equals(
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
                    stakingPool,
                    receipt,
                    expectedEvents
                )
            })

            it('onlyOwner', async () => {
                await expect(
                    stakingPool
                        .connect(nonAdmin)
                        .updateTokenSweepBeneficiary(nonAdmin.address)
                ).to.be.revertedWith('Ownable: caller is not the owner')
            })

            it('only when not paused', async () => {
                await stakingPool.pause()

                await expect(
                    stakingPool.updateTokenSweepBeneficiary(nonAdmin.address)
                ).to.be.revertedWith('Pausable: paused')
            })
            after(async () => {
                await stakingPool.unpause()
                await stakingPool.updateTokenSweepBeneficiary(treasury)
            })
        })

        describe('ERC20 token sweep', () => {
            it('side effects', async () => {
                const seedFunds = 100n
                const sweepAmount = 55n
                await successfulTransaction(
                    collateralTokens.transfer(stakingPool.address, seedFunds)
                )
                expect(
                    await collateralTokens.balanceOf(stakingPool.address)
                ).equals(seedFunds)
                expect(await collateralTokens.balanceOf(treasury)).equals(0)

                const receipt = await successfulTransaction(
                    stakingPool.sweepERC20Tokens(
                        collateralTokens.address,
                        sweepAmount
                    )
                )

                expect(
                    await collateralTokens.balanceOf(stakingPool.address)
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
                verifyERC20SweepLogEvents(stakingPool, receipt, expectedEvents)
            })

            it('onlyOwner', async () => {
                await expect(
                    stakingPool
                        .connect(nonAdmin)
                        .sweepERC20Tokens(collateralTokens.address, 5)
                ).to.be.revertedWith('Ownable: caller is not the owner')
            })

            it('only when not paused', async () => {
                await stakingPool.pause()

                await expect(
                    stakingPool.sweepERC20Tokens(collateralTokens.address, 5)
                ).to.be.revertedWith('Pausable: paused')
            })
        })
        after(async () => {
            await stakingPool.unpause()
        })
    })

    describe('Floating Staking Pool', () => {
        before(async () => {
            admin = (await signer(0)).address
            user = await signer(1)
            user2 = await signer(2)
            const symbol = 'EEK'
            stakeTokens = await deployContract<ERC20PresetMinterPauser>(
                'ERC20PresetMinterPauser',
                'Another erc20 Token',
                symbol
            )
            const epochStartTimestamp = (await getTimestampNow()) + START_DELAY
            const rewardsAvailableTimestamp =
                REWARDS_AVAILABLE_OFFSET + epochStartTimestamp + EPOCH_DURATION
            const stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                minimumContribution: 5,
                epochDuration: EPOCH_DURATION,
                epochStartTimestamp,
                treasury: admin,
                stakeToken: stakeTokens.address,
                rewardType: RewardType.FLOATING,
                rewardTokens: []
            }

            stakingPool = await deployContract('StakingPool')
            await stakingPool.initialize(
                stakingPoolInfo,
                false,
                rewardsAvailableTimestamp,
                admin
            )
        })

        describe('deposit', () => {
            const depositAmount = BigNumber.from(20)

            it('allows user to deposit', async () => {
                const depositReceipt = await userDeposit(user, depositAmount)
                verifyDepositEvent(
                    {depositAmount, user: user.address},
                    depositReceipt
                )
            })

            it('allows user to deposit again', async () => {
                await userDeposit(user, depositAmount)
            })

            it('does not allow user to deposit when staking pool full', async () => {
                await increaseTime(START_DELAY)
                await expect(
                    userDeposit(user, BigNumber.from(1000))
                ).to.be.revertedWith('StakingPool: oversubscribed')
            })

            it('does not allow user to deposit when amount less than min contribution', async () => {
                await increaseTime(START_DELAY)
                await expect(
                    userDeposit(user, BigNumber.from(4))
                ).to.be.revertedWith('StakingPool: min contribution')
            })

            it('does not allow user to deposit when lockup has started', async () => {
                await increaseTime(START_DELAY)
                await expect(
                    userDeposit(user, depositAmount)
                ).to.be.revertedWith('StakingPool: too late')
            })
        })
        describe('withdraw', () => {
            const amount = BigNumber.from(20)
            it('cant withdraw since not past reward start date', async () => {
                expect(await stakingPool.isRewardsAvailable()).to.be.false
                await expect(userWithdraw(user)).to.be.revertedWith(
                    'StakingPool: still stake period'
                )
            })

            it('cant withdraw staking period not complete', async () => {
                expect(await stakingPool.isRedeemable()).to.be.false
                await expect(userWithdraw(user)).to.be.revertedWith(
                    'StakingPool: still stake period'
                )
            })

            it('allows a user to withdraw', async () => {
                await increaseTime(EPOCH_DURATION)
                expect(await stakingPool.isRedeemable()).to.be.true
                expect(await stakingPool.isRewardsAvailable()).to.be.true
                verifyWithdrawEvent(
                    {user: user.address, stake: amount.mul(2)},
                    await userWithdraw(user)
                )
            })

            it('doesnt allow a user to withdraw twice', async () => {
                await expect(userWithdraw(user)).to.be.revertedWith(
                    'StakingPool: not eligible'
                )
            })
        })

        describe('withdraw without rewards', () => {
            let epochStartTimestamp: number
            const amount = BigNumber.from(20)

            beforeEach(async () => {
                epochStartTimestamp = (await getTimestampNow()) + START_DELAY
                const rewardsAvailableTimestamp =
                    REWARDS_AVAILABLE_OFFSET +
                    epochStartTimestamp +
                    EPOCH_DURATION
                const stakingPoolInfo = {
                    daoId: 0,
                    minTotalPoolStake: MIN_POOL_STAKE,
                    maxTotalPoolStake: 600,
                    minimumContribution: 5,
                    epochDuration: EPOCH_DURATION,
                    epochStartTimestamp,
                    treasury: admin,
                    stakeToken: stakeTokens.address,
                    rewardType: RewardType.FLOATING,
                    rewardTokens: []
                }

                stakingPool = await deployContract('StakingPool')
                await stakingPool.initialize(
                    stakingPoolInfo,
                    false,
                    rewardsAvailableTimestamp,
                    admin
                )
            })

            it('can withdraw without rewards if staking pool requirements are unmet', async () => {
                await userDeposit(user, amount)
                await increaseTime(
                    epochStartTimestamp - (await getTimestampNow())
                )
                await userWithdrawWithoutRewards(user)
            })

            it('cannot withdraw without rewards if staking pool requirements are unmet', async () => {
                await userDeposit(user, amount)
                await expect(
                    userWithdrawWithoutRewards(user)
                ).to.be.revertedWith('StakingPool: requirements unmet')
            })
        })
        describe('withdraw stake', () => {
            let epochStartTimestamp: BigNumber
            let rewardsAvailableTimestamp: BigNumber
            const amount = BigNumber.from(20)

            beforeEach(async () => {
                epochStartTimestamp = BigNumber.from(
                    await getTimestampNow()
                ).add(Number(START_DELAY))

                rewardsAvailableTimestamp = BigNumber.from(
                    REWARDS_AVAILABLE_OFFSET
                )
                    .add(epochStartTimestamp)
                    .add(EPOCH_DURATION)

                rewardToken1 = await deployContract<ERC20PresetMinterPauser>(
                    'ERC20PresetMinterPauser',
                    'Another erc20 Token',
                    'SYM'
                )

                const stakingPoolInfo = {
                    daoId: 0,
                    minTotalPoolStake: MIN_POOL_STAKE,
                    maxTotalPoolStake: 600,
                    minimumContribution: 5,
                    epochDuration: EPOCH_DURATION,
                    epochStartTimestamp,
                    treasury: admin,
                    stakeToken: stakeTokens.address,
                    rewardType: RewardType.FLOATING,
                    rewardTokens: [
                        {
                            tokens: rewardToken1.address,
                            maxAmount: REWARD_TOKEN_1_AMOUNT,
                            ratio: 0
                        }
                    ]
                }

                stakingPool = await deployContract('StakingPool')
                await stakingPool.initialize(
                    stakingPoolInfo,
                    false,
                    rewardsAvailableTimestamp,
                    admin
                )
                await rewardToken1.mint(
                    stakingPool.address,
                    REWARD_TOKEN_1_AMOUNT
                )
            })

            it('cannot withdraw stake before staking period ends', async () => {
                await userDeposit(user, amount)
                await expect(userWithdrawStake(user)).to.be.revertedWith(
                    'StakingPool: still stake period'
                )
            })

            it('can withdraw stake after staking period', async () => {
                await userDeposit(user, amount)
                await increaseTime(EPOCH_DURATION + START_DELAY)
                await userWithdrawStake(user)
            })

            it('cannot withdraw both stake and rewards after withdrawing stake', async () => {
                await userDeposit(user, amount)

                await increaseTime(EPOCH_DURATION + START_DELAY)
                await userWithdrawStake(user)

                await increaseTime(REWARDS_AVAILABLE_OFFSET) // increase time to rewards release
                await expect(userWithdraw(user)).to.be.revertedWith(
                    'StakingPool: not eligible'
                )
            })

            it('can withdraw rewards after withdrawing stake', async () => {
                await userDeposit(user, amount)

                await increaseTime(EPOCH_DURATION + START_DELAY) // increase past staking period

                await userWithdrawStake(user)
                await increaseTime(REWARDS_AVAILABLE_OFFSET)

                verifyWithdrawRewardsEvent(
                    {
                        user: user.address,
                        rewards: BigNumber.from(REWARD_TOKEN_1_AMOUNT),
                        rewardToken: rewardToken1.address
                    },
                    await userWithdrawRewards(user)
                )
            })

            it('2 users split rewards', async () => {
                const splitRewards = BigNumber.from(REWARD_TOKEN_1_AMOUNT).div(
                    2
                )
                await userDeposit(user, amount)

                // 1 user would get 100pc of the rewards
                expect(
                    (await stakingPool.currentExpectedRewards(user.address))[0]
                ).to.equal(REWARD_TOKEN_1_AMOUNT)

                await userDeposit(user2, amount)

                // increase past staking period
                await increaseTime(EPOCH_DURATION + START_DELAY)

                await userWithdrawStake(user)
                await userWithdrawStake(user2)
                await increaseTime(REWARDS_AVAILABLE_OFFSET)

                expect(
                    (await stakingPool.currentExpectedRewards(user.address))[0]
                ).to.equal(splitRewards)

                verifyWithdrawRewardsEvent(
                    {
                        user: user.address,
                        rewards: splitRewards,
                        rewardToken: rewardToken1.address
                    },
                    await userWithdrawRewards(user)
                )
                verifyWithdrawRewardsEvent(
                    {
                        user: user2.address,
                        rewards: splitRewards,
                        rewardToken: rewardToken1.address
                    },
                    await userWithdrawRewards(user2)
                )
            })
        })
    })
    describe('Fixed Staking Tests', () => {
        const rewardAmountRatio = 10
        before(async () => {
            admin = (await signer(0)).address
            user = await signer(1)
            user2 = await signer(2)
            const symbol = 'EEK'
            stakeTokens = await deployContract<ERC20PresetMinterPauser>(
                'ERC20PresetMinterPauser',
                'Another erc20 Token',
                symbol
            )
            rewardToken1 = await deployContract<ERC20PresetMinterPauser>(
                'ERC20PresetMinterPauser',
                'Another erc20 Token',
                'SYM'
            )
            const epochStartTimestamp = (await getTimestampNow()) + START_DELAY
            const rewardsAvailableTimestamp =
                REWARDS_AVAILABLE_OFFSET + epochStartTimestamp + EPOCH_DURATION
            const stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                minimumContribution: 5,
                epochDuration: EPOCH_DURATION,
                epochStartTimestamp,
                treasury: admin,
                stakeToken: stakeTokens.address,
                rewardType: RewardType.FIXED,
                rewardTokens: [
                    {
                        tokens: rewardToken1.address,
                        maxAmount: 2000,
                        ratio: rewardAmountRatio
                    }
                ]
            }

            stakingPool = await deployContract('StakingPool')
            await stakingPool.initialize(
                stakingPoolInfo,
                false,
                rewardsAvailableTimestamp,
                admin
            )
            await rewardToken1.mint(stakingPool.address, REWARD_TOKEN_1_AMOUNT)
        })
        describe('withdraw stake', () => {
            const amount = BigNumber.from(80)
            it('2 users get the same reward', async () => {
                await userDeposit(user, amount)
                await userDeposit(user2, amount)

                // increase past staking period
                await increaseTime(EPOCH_DURATION + START_DELAY)

                await userWithdrawStake(user)
                await userWithdrawStake(user2)
                await increaseTime(REWARDS_AVAILABLE_OFFSET)

                expect(
                    (await stakingPool.currentExpectedRewards(user.address))[0]
                ).to.equal(amount.mul(rewardAmountRatio))
                expect(
                    (await stakingPool.currentExpectedRewards(user2.address))[0]
                ).to.equal(amount.mul(rewardAmountRatio))

                verifyWithdrawRewardsEvent(
                    {
                        user: user.address,
                        rewards: amount.mul(rewardAmountRatio),
                        rewardToken: rewardToken1.address
                    },
                    await userWithdrawRewards(user)
                )
                verifyWithdrawRewardsEvent(
                    {
                        user: user2.address,
                        rewards: amount.mul(rewardAmountRatio),
                        rewardToken: rewardToken1.address
                    },
                    await userWithdrawRewards(user2)
                )
            })
        })
    })
    describe('No rewards pool', () => {
        const amount = BigNumber.from(50)
        beforeEach(async () => {
            admin = (await signer(0)).address
            user = await signer(1)
            user2 = await signer(2)
            const symbol = 'EEK'
            stakeTokens = await deployContract<ERC20PresetMinterPauser>(
                'ERC20PresetMinterPauser',
                'Another erc20 Token',
                symbol
            )
            const epochStartTimestamp = (await getTimestampNow()) + START_DELAY
            const rewardsAvailableTimestamp =
                REWARDS_AVAILABLE_OFFSET + epochStartTimestamp + EPOCH_DURATION
            const stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                minimumContribution: 5,
                epochDuration: EPOCH_DURATION,
                epochStartTimestamp,
                treasury: admin,
                stakeToken: stakeTokens.address,
                rewardType: RewardType.NONE,
                rewardTokens: []
            }

            stakingPool = await deployContract('StakingPool')

            await stakingPool.initialize(
                stakingPoolInfo,
                false,
                rewardsAvailableTimestamp,
                admin
            )
        })
        it('user can deposit and withdraw', async () => {
            verifyDepositEvent(
                {user: user.address, depositAmount: amount},
                await userDeposit(user, amount)
            )
            // increase past staking period
            await increaseTime(EPOCH_DURATION + START_DELAY)
            await increaseTime(REWARDS_AVAILABLE_OFFSET)

            verifyWithdrawEvent(
                {
                    user: user.address,
                    stake: amount
                },
                await userWithdraw(user)
            )
        })

        it('user can deposit and withdraw stake', async () => {
            verifyDepositEvent(
                {user: user.address, depositAmount: amount},
                await userDeposit(user, amount)
            )
            // increase past staking period
            await increaseTime(EPOCH_DURATION + START_DELAY)
            await increaseTime(REWARDS_AVAILABLE_OFFSET)

            verifyWithdrawEvent(
                {
                    user: user.address,
                    stake: amount
                },
                await userWithdrawStake(user)
            )
        })

        it('user cannot withdraw rewards', async () => {
            verifyDepositEvent(
                {user: user.address, depositAmount: amount},
                await userDeposit(user, amount)
            )
            // increase past staking period
            await increaseTime(EPOCH_DURATION + START_DELAY)
            await increaseTime(REWARDS_AVAILABLE_OFFSET)

            const currentExpectedRewards =
                await stakingPool.currentExpectedRewards(user.address)
            expect(currentExpectedRewards).to.be.length(0)
            await expect(
                stakingPool.connect(user).withdrawRewards()
            ).to.be.revertedWith('StakingPool: withdraw stake')

            await userWithdrawStake(user)
            verifyNoRewardsEvent(
                {user: user.address},
                await userWithdrawRewards(user)
            )
        })
    })
    describe('Common admin functions', () => {
        let epochStartTimestamp: BigNumber
        let rewardsAvailableTimestamp: BigNumber
        before(async () => {
            admin = (await signer(0)).address
            user = await signer(1)
            const symbol = 'EEK'
            stakeTokens = await deployContract<ERC20PresetMinterPauser>(
                'ERC20PresetMinterPauser',
                'Another erc20 Token',
                symbol
            )

            epochStartTimestamp = BigNumber.from(await getTimestampNow()).add(
                Number(START_DELAY)
            )

            rewardsAvailableTimestamp = BigNumber.from(REWARDS_AVAILABLE_OFFSET)
                .add(epochStartTimestamp)
                .add(EPOCH_DURATION)

            rewardToken1 = await deployContract<ERC20PresetMinterPauser>(
                'ERC20PresetMinterPauser',
                'Another erc20 Token',
                'SYM'
            )

            const stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                minimumContribution: 5,
                epochDuration: EPOCH_DURATION,
                epochStartTimestamp,
                emergencyMode: false,
                treasury: admin,
                stakeToken: stakeTokens.address,
                rewardType: RewardType.FLOATING,
                rewardTokens: [
                    {
                        tokens: rewardToken1.address,
                        maxAmount: 2000,
                        ratio: 0
                    }
                ]
            }

            stakingPool = await deployContract('StakingPool')

            await stakingPool.initialize(
                stakingPoolInfo,
                false,
                rewardsAvailableTimestamp,
                admin
            )
            await rewardToken1.mint(stakingPool.address, REWARD_TOKEN_1_AMOUNT)
        })
        describe('only dao admin', () => {
            it('can set rewardsReleaseTimestamp', async () => {
                await stakingPool.setRewardsAvailableTimestamp(
                    (await getTimestampNow()) + 10
                )
            })
            it('cannot set rewardsReleaseTimestamp in past', async () => {
                await expect(
                    stakingPool.setRewardsAvailableTimestamp(
                        (await getTimestampNow()) - 1
                    )
                ).to.be.revertedWith('StakePool: future rewards')
            })
            it('cannot set rewardsReleaseTimestamp when already finalized', async () => {
                await increaseTime(
                    (await getTimestampNow()) + START_DELAY + EPOCH_DURATION
                )

                expect(await stakingPool.isStakingPeriodComplete()).to.be.true

                await expect(
                    stakingPool.setRewardsAvailableTimestamp(
                        (await getTimestampNow()) + 1
                    )
                ).to.be.revertedWith('StakePool: already finalized')
            })
            it('can emergency reward sweep when enabled', async () => {
                await stakingPool.enableEmergencyMode()
            })
        })
    })

    async function userWithdrawStake(
        user: SignerWithAddress
    ): Promise<ContractReceipt> {
        return successfulTransaction(stakingPool.connect(user).withdrawStake())
    }
    async function userWithdrawRewards(
        user: SignerWithAddress
    ): Promise<ContractReceipt> {
        return successfulTransaction(
            stakingPool.connect(user).withdrawRewards()
        )
    }

    async function userDeposit(
        user: SignerWithAddress,
        amount: BigNumber
    ): Promise<ContractReceipt> {
        await stakeTokens.mint(user.address, amount)
        await stakeTokens
            .connect(user)
            .increaseAllowance(stakingPool.address, amount)
        return successfulTransaction(stakingPool.connect(user).deposit(amount))
    }
    async function userWithdraw(
        user: SignerWithAddress
    ): Promise<ContractReceipt> {
        return successfulTransaction(stakingPool.connect(user).withdraw())
    }
    async function userWithdrawWithoutRewards(
        user: SignerWithAddress
    ): Promise<ContractReceipt> {
        return successfulTransaction(stakingPool.connect(user).earlyWithdraw())
    }
    async function initializeRewards(
        rewardToken: ERC20PresetMinterPauser,
        treasury: string,
        amount: BigNumber,
        ratio: number
    ): Promise<ContractReceipt> {
        await rewardToken.increaseAllowance(stakingPool.address, amount)

        return successfulTransaction(
            stakingPool.initializeRewardTokens(treasury, [
                {
                    tokens: rewardToken.address,
                    maxAmount: amount,
                    ratio
                }
            ])
        )
    }

    let admin: string
    let user: SignerWithAddress
    let user2: SignerWithAddress
    let stakeTokens: ERC20PresetMinterPauser
    let stakingPool: StakingPool
    let rewardToken1: ERC20PresetMinterPauser
})
