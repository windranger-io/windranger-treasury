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
import {BigNumber, ContractReceipt} from 'ethers'

import {StakingPoolType} from './contracts/staking/staking-events'
import {verifyStakingPoolCreated} from './contracts/staking/verify-staking-factory-events'
import {successfulTransaction} from './framework/transaction'

// Wires up Waffle with Chai
chai.use(solidity)

const EPOCH_DURATION = 60
const START_DELAY = 15
const REWARDS_AVAILABLE_OFFSET = 20
const MIN_POOL_STAKE = 500

describe.only('Staking Pool FactoryTests', () => {
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
                treasury: admin,
                totalStakedAmount: 0,
                stakeToken: stakeTokens.address,
                poolType: StakingPoolType.FLOATING,
                rewardTokens: []
            }
            await stakingPoolFactory.createStakingPool(stakingPoolInfo)
        })
        it('create fixed pool', async () => {
            const epochStartTimestamp = (await getTimestampNow()) + START_DELAY
            const stakingPoolEventData = {
                stakeToken: stakeTokens.address,
                stakingPoolType: StakingPoolType.FIXED,
                rewardTokens: [],
                minimumContribution: BigNumber.from(5),
                epochDuration: EPOCH_DURATION,
                epochStartTimestamp,
                treasury: admin
            }

            const stakingPoolInfo = {
                daoId: 0,
                minTotalPoolStake: MIN_POOL_STAKE,
                maxTotalPoolStake: 600,
                rewardsAvailableTimestamp:
                    REWARDS_AVAILABLE_OFFSET +
                    epochStartTimestamp +
                    EPOCH_DURATION,
                emergencyMode: false,
                totalStakedAmount: 0,
                ...stakingPoolEventData
            }

            const stakingPoolEvent = {
                creator: admin,
                ...stakingPoolEventData
            }
            /*
             * verifyStakingPoolCreated(
             *     stakingPoolEvent,
             *     await createStakingPool(stakingPoolInfo)
             * )
             */
        })
    })

    /*
     * async function createStakingPool(
     *     stakingPoolInfo: any
     * ): Promise<ContractReceipt> {
     *     return successfulTransaction(
     *         stakingPoolFactory.createStakingPool(stakingPoolInfo)
     *     )
     * }
     */

    let admin: string
    let stakingPoolFactory: StakingPoolFactory
    let stakeTokens: ERC20PresetMinterPauser
})
