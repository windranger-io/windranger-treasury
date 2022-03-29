// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {StakingPoolFactory, ERC20PresetMinterPauser} from '../typechain-types'
import {deployContract, signer} from './framework/contracts'
import {getTimestampNow} from './framework/time'
import {BigNumber} from 'ethers'

import {StakingPoolType} from './contracts/staking/staking-events'
import {verifyStakingPoolCreated} from './contracts/staking/verify-staking-factory-events'
import {successfulTransaction} from './framework/transaction'

// Wires up Waffle with Chai
chai.use(solidity)

const EPOCH_DURATION = 60
const START_DELAY = 15
const REWARDS_AVAILABLE_OFFSET = 20
const MIN_POOL_STAKE = 500

export type StakingPoolLibData = {
    stakeToken: string
    poolType: number
    rewardTokens: never[]
    minimumContribution: BigNumber
    epochDuration: BigNumber
    epochStartTimestamp: BigNumber
    treasury: string
    daoId: number
    minTotalPoolStake: number
    maxTotalPoolStake: number
    rewardsAvailableTimestamp: BigNumber
    emergencyMode: boolean
    launchPaused: boolean
    totalStakedAmount: number
}

describe('Staking Pool FactoryTests', () => {
    let stakingPoolInfo: StakingPoolLibData
    before(async () => {
        admin = (await signer(0)).address
        const symbol = 'EEK'
        stakeTokens = await deployContract<ERC20PresetMinterPauser>(
            'ERC20PresetMinterPauser',
            'Another erc20 Token',
            symbol
        )
        stakingPoolFactory = await deployContract('StakingPoolFactory')
        await stakingPoolFactory.initialize()
    })

    describe('create pools', () => {
        it('create floating pool', async () => {
            const epochStartTimestamp = BigNumber.from(
                (await getTimestampNow()) + START_DELAY
            )
            const stakingPoolEventData = {
                stakeToken: stakeTokens.address,
                poolType: StakingPoolType.FLOATING,
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
                rewardsAvailableTimestamp: epochStartTimestamp
                    .add(REWARDS_AVAILABLE_OFFSET)
                    .add(EPOCH_DURATION),
                emergencyMode: false,
                launchPaused: false,
                totalStakedAmount: 0,
                ...stakingPoolEventData
            }

            const stakingPoolEvent = {
                creator: admin,
                ...stakingPoolEventData
            }
            await stakingPoolFactory.createStakingPool(stakingPoolInfo)
        })

        it('paused cannot create pool', async () => {
            await stakingPoolFactory.pause()
            await expect(
                stakingPoolFactory.createStakingPool(stakingPoolInfo)
            ).to.be.revertedWith('Pausable: paused')
            await stakingPoolFactory.unpause()
        })

        it('create fixed pool', async () => {
            const epochStartTimestamp = BigNumber.from(
                (await getTimestampNow()) + START_DELAY
            )
            const stakingPoolEventData = {
                stakeToken: stakeTokens.address,
                poolType: StakingPoolType.FIXED,
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
                rewardsAvailableTimestamp: epochStartTimestamp
                    .add(REWARDS_AVAILABLE_OFFSET)
                    .add(EPOCH_DURATION),
                emergencyMode: false,
                launchPaused: false,
                totalStakedAmount: 0,
                ...stakingPoolEventData
            }

            const stakingPoolEvent = {
                creator: admin,
                ...stakingPoolEventData
            }
            verifyStakingPoolCreated(
                stakingPoolEvent,
                await successfulTransaction(
                    stakingPoolFactory.createStakingPool(stakingPoolInfo)
                )
            )
        })
    })

    let admin: string
    let stakingPoolFactory: StakingPoolFactory
    let stakeTokens: ERC20PresetMinterPauser
})
