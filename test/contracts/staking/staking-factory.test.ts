// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    StakingPoolFactory,
    ERC20PresetMinterPauser
} from '../../../typechain-types'
import {deployContract, signer} from '../../framework/contracts'
import {getTimestampNow} from '../../framework/time'
import {BigNumber} from 'ethers'

import {RewardType} from './staking-events'
import {verifyStakingPoolCreated} from './verify-staking-factory-events'
import {successfulTransaction} from '../../framework/transaction'

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

describe('Staking Pool FactoryTests', () => {
    let stakingPoolInfo: StakingPoolLibData
    let epochStartTimestamp: BigNumber
    let rewardsAvailableTimestamp: BigNumber
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
        epochStartTimestamp = BigNumber.from(
            (await getTimestampNow()) + START_DELAY
        )
        rewardsAvailableTimestamp = epochStartTimestamp
            .add(REWARDS_AVAILABLE_OFFSET)
            .add(EPOCH_DURATION)
    })

    describe('create pools', () => {
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
            /*
             * const epochStartTimestamp = BigNumber.from(
             *     (await getTimestampNow()) + START_DELAY
             * )
             */
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

    let admin: string
    let stakingPoolFactory: StakingPoolFactory
    let stakeTokens: ERC20PresetMinterPauser
})
