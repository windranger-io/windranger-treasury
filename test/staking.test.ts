// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {StakingPool, ERC20PresetMinterPauser} from '../typechain-types'
import {deployContract, signer} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'
import {getTimestampNow, increaseTime} from './framework/time'
import {BigNumber, ContractReceipt} from 'ethers'

import {
    verifyDepositEvent,
    verifyInitializeRewardsEvent,
    verifyWithdrawEvent,
    verifyWithdrawRewardsEvent
} from './contracts/staking/verify-staking-events'
import {StakingPoolType} from './contracts/staking/staking-events'

// Wires up Waffle with Chai
chai.use(solidity)

type RewardToken = {
    token: string
    rewardAmountRatio: BigNumber
    totalTokenRewardsAvailable: BigNumber
}

const EPOCH_DURATION = 60
const START_DELAY = 15
const REWARDS_AVAILABLE_OFFSET = 20
const MIN_POOL_STAKE = 500
const REWARD_TOKEN_1_AMOUNT = 2000

describe('Staking Pool Tests', () => {
    describe.only('Initialization', () => {
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
            const stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                minimumContribution: 5,
                epochDuration: EPOCH_DURATION,
                epochStartTimestamp,
                rewardsAvailableTimestamp:
                    REWARDS_AVAILABLE_OFFSET +
                    epochStartTimestamp +
                    EPOCH_DURATION,
                emergencyMode: false,
                launchPaused: true,
                treasury: admin,
                totalStakedAmount: 0,
                stakeToken: stakeTokens.address,
                poolType: StakingPoolType.FLOATING,
                rewardTokens: []
            }

            stakingPool = await deployContract('StakingPool')
            await stakingPool.initialize(stakingPoolInfo)

            await expect(
                userDeposit(user, BigNumber.from(20))
            ).to.be.revertedWith('Pausable: paused')

            await increaseTime(START_DELAY)
            await stakingPool.unpause()

            expect(await userDeposit(user, BigNumber.from(5)))
        })
        it('initialize rewards', async () => {
            const amount = BigNumber.from(9090)
            await rewardToken1.mint(admin, amount)
            verifyInitializeRewardsEvent(
                {rewardTokens: rewardToken1.address, amount},
                await initializeRewards(
                    rewardToken1,
                    admin,
                    amount,
                    BigNumber.from(1)
                )
            )
        })
    })

    describe('Floating Staking Tests', () => {
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

            const stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                minimumContribution: 5,
                epochDuration: EPOCH_DURATION,
                epochStartTimestamp,
                rewardsAvailableTimestamp:
                    REWARDS_AVAILABLE_OFFSET +
                    epochStartTimestamp +
                    EPOCH_DURATION,
                emergencyMode: false,
                launchPaused: false,
                treasury: admin,
                totalStakedAmount: 0,
                stakeToken: stakeTokens.address,
                poolType: StakingPoolType.FLOATING,
                rewardTokens: []
            }

            stakingPool = await deployContract('StakingPool')
            await stakingPool.initialize(stakingPoolInfo)
        })

        describe('deposit', () => {
            const depositAmount = BigNumber.from(20)

            it('does not allow user to deposit when stakingPeriodNotStarted', async () => {
                await expect(
                    userDeposit(user, depositAmount)
                ).to.be.revertedWith('StakingPool: too early')
            })

            it('does not allow user to deposit when staking pool full', async () => {
                await increaseTime(START_DELAY)
                await expect(
                    userDeposit(user, BigNumber.from(1000))
                ).to.be.revertedWith('StakingPool: pool full')
            })

            it('does not allow user to deposit when amount less than min contribution', async () => {
                await increaseTime(START_DELAY)
                await expect(
                    userDeposit(user, BigNumber.from(4))
                ).to.be.revertedWith('StakingPool: min contribution')
            })

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
        })
        describe('withdraw', () => {
            const amount = BigNumber.from(20)
            it('cant withdraw since not past reward start date', async () => {
                // await increaseTime(START_DELAY + REWARDS_AVAILABLE_OFFSET)
                await expect(userWithdraw(user)).to.be.revertedWith(
                    'StakingPool: still stake period'
                )
            })

            it('cant withdraw staking period not complete', async () => {
                await expect(userWithdraw(user)).to.be.revertedWith(
                    'StakingPool: still stake period'
                )
            })

            it('allows a user to withdraw', async () => {
                await userDeposit(user2, amount)
                await increaseTime(EPOCH_DURATION)
                const withdrawReceipt = await userWithdraw(user2)
                verifyWithdrawEvent(
                    {user: user2.address, stake: amount},
                    withdrawReceipt
                )
            })

            it('doesnt allow a user to withdraw twice', async () => {
                await expect(userWithdraw(user2)).to.be.revertedWith(
                    'StakingPool: not eligible'
                )
            })
        })

        describe('withdraw without rewards', () => {
            let epochStartTimestamp: number
            beforeEach(async () => {
                epochStartTimestamp = (await getTimestampNow()) + START_DELAY

                const stakingPoolInfo = {
                    daoId: 0,
                    minTotalPoolStake: MIN_POOL_STAKE,
                    maxTotalPoolStake: 600,
                    minimumContribution: 5,
                    epochDuration: EPOCH_DURATION,
                    epochStartTimestamp,
                    rewardsAvailableTimestamp:
                        REWARDS_AVAILABLE_OFFSET +
                        epochStartTimestamp +
                        EPOCH_DURATION,
                    emergencyMode: false,
                    launchPaused: false,
                    treasury: admin,
                    totalStakedAmount: 0,
                    stakeToken: stakeTokens.address,
                    poolType: StakingPoolType.FLOATING,
                    rewardTokens: []
                }

                stakingPool = await deployContract('StakingPool')
                await stakingPool.initialize(stakingPoolInfo)
            })

            const amount = BigNumber.from(20)

            it('cannot withdraw without rewards if staking pool requirements are unmet', async () => {
                await increaseTime(START_DELAY)
                await userDeposit(user, amount)

                await increaseTime(
                    epochStartTimestamp - (await getTimestampNow())
                )
                await userWithdrawWithoutRewards(user)
            })

            it('can withdraw without rewards if staking pool requirements are unmet', async () => {
                await increaseTime(START_DELAY)
                await userDeposit(user, BigNumber.from(MIN_POOL_STAKE))
                await expect(
                    userWithdrawWithoutRewards(user)
                ).to.be.revertedWith('StakingPool: requirements unmet')
            })
        })
        describe('withdraw stake', () => {
            let epochStartTimestamp: BigNumber
            let rewardsAvailableTimestamp: BigNumber
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
                    rewardsAvailableTimestamp,
                    emergencyMode: false,
                    launchPaused: false,
                    treasury: admin,
                    totalStakedAmount: 0,
                    stakeToken: stakeTokens.address,
                    poolType: 1,
                    rewardTokens: [
                        {
                            token: rewardToken1.address,
                            totalTokenRewardsAvailable: 2000,
                            rewardAmountRatio: 0
                        }
                    ]
                }

                stakingPool = await deployContract('StakingPool')
                await stakingPool.initialize(stakingPoolInfo)
                await rewardToken1.mint(
                    stakingPool.address,
                    REWARD_TOKEN_1_AMOUNT
                )
            })

            const amount = BigNumber.from(20)
            it('cannot withdraw stake before staking period ends', async () => {
                await increaseTime(START_DELAY)

                await userDeposit(user, amount)

                await expect(userWithdrawStake(user)).to.be.revertedWith(
                    'StakingPool: still stake period'
                )
            })

            it('can withdraw stake after staking period', async () => {
                await increaseTime(START_DELAY)

                await userDeposit(user, amount)
                await increaseTime(EPOCH_DURATION)
                await userWithdrawStake(user)
            })

            it('cannot withdraw both stake and rewards after withdrawing stake', async () => {
                await increaseTime(START_DELAY)

                await userDeposit(user, amount)

                await increaseTime(EPOCH_DURATION)
                await userWithdrawStake(user)

                // increase time to rewards release
                await increaseTime(REWARDS_AVAILABLE_OFFSET)
                await expect(userWithdraw(user)).to.be.revertedWith(
                    'StakingPool: not eligible'
                )
            })

            it('can withdraw rewards after withdrawing stake', async () => {
                await increaseTime(START_DELAY)

                await userDeposit(user, amount)

                // increase past staking period
                await increaseTime(EPOCH_DURATION)

                await userWithdrawStake(user)
                await increaseTime(REWARDS_AVAILABLE_OFFSET)
                const receipt = await userWithdrawRewards(user)
                verifyWithdrawRewardsEvent(
                    {
                        user: user.address,
                        rewards: BigNumber.from(REWARD_TOKEN_1_AMOUNT),
                        rewardToken: rewardToken1.address
                    },
                    receipt
                )
            })

            it('2 users split rewards', async () => {
                await increaseTime(START_DELAY)

                await userDeposit(user, amount)
                await userDeposit(user2, amount)

                // increase past staking period
                await increaseTime(EPOCH_DURATION)

                await userWithdrawStake(user)
                await userWithdrawStake(user2)
                await increaseTime(REWARDS_AVAILABLE_OFFSET)
                verifyWithdrawRewardsEvent(
                    {
                        user: user.address,
                        rewards: BigNumber.from(REWARD_TOKEN_1_AMOUNT).div(2),
                        rewardToken: rewardToken1.address
                    },
                    await userWithdrawRewards(user)
                )
                verifyWithdrawRewardsEvent(
                    {
                        user: user2.address,
                        rewards: BigNumber.from(REWARD_TOKEN_1_AMOUNT).div(2),
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

            const stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                minimumContribution: 5,
                epochDuration: EPOCH_DURATION,
                epochStartTimestamp,
                rewardsAvailableTimestamp:
                    REWARDS_AVAILABLE_OFFSET +
                    epochStartTimestamp +
                    EPOCH_DURATION,
                launchPaused: false,
                emergencyMode: false,

                treasury: admin,
                totalStakedAmount: 0,
                stakeToken: stakeTokens.address,
                poolType: StakingPoolType.FIXED,
                rewardTokens: [
                    {
                        token: rewardToken1.address,
                        totalTokenRewardsAvailable: 2000,
                        rewardAmountRatio
                    }
                ]
            }

            stakingPool = await deployContract('StakingPool')
            await stakingPool.initialize(stakingPoolInfo)
            await rewardToken1.mint(stakingPool.address, REWARD_TOKEN_1_AMOUNT)
        })
        describe('withdraw stake', () => {
            const amount = BigNumber.from(80)
            it('2 users get the same reward', async () => {
                await increaseTime(START_DELAY)

                await userDeposit(user, amount)
                await userDeposit(user2, amount)

                // increase past staking period
                await increaseTime(EPOCH_DURATION)

                await userWithdrawStake(user)
                await userWithdrawStake(user2)
                await increaseTime(REWARDS_AVAILABLE_OFFSET)
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
                rewardsAvailableTimestamp,
                emergencyMode: false,
                launchPaused: false,
                treasury: admin,
                totalStakedAmount: 0,
                stakeToken: stakeTokens.address,
                poolType: 1,
                rewardTokens: [
                    {
                        token: rewardToken1.address,
                        totalTokenRewardsAvailable: 2000,
                        rewardAmountRatio: 0
                    }
                ]
            }

            stakingPool = await deployContract('StakingPool')

            await stakingPool.initialize(stakingPoolInfo)
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
            it('cannot emergency reward sweep when not enabled', async () => {
                await expect(
                    stakingPool.adminEmergencyRewardSweep()
                ).to.be.revertedWith('StakingPool: not emergency mode')
            })
            it('can emergency reward sweep when enabled', async () => {
                await stakingPool.enableEmergencyMode()
                await stakingPool.adminEmergencyRewardSweep()
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
        return successfulTransaction(
            stakingPool.connect(user).withdrawWithoutRewards()
        )
    }
    async function initializeRewards(
        rewardToken: ERC20PresetMinterPauser,
        treasury: string,
        amount: BigNumber,
        rewardAmountRatio: BigNumber
    ): Promise<ContractReceipt> {
        await rewardToken.increaseAllowance(stakingPool.address, amount)

        return successfulTransaction(
            stakingPool.initializeRewardTokens(treasury, [
                {
                    token: rewardToken.address,
                    rewardAmountRatio,
                    totalTokenRewardsAvailable: amount
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
