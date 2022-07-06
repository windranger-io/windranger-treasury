import {ethers} from 'hardhat'
import {StakingPoolMediator} from '../../typechain-types'
import {log} from '../../config/logging'
import {
    addressEnvironmentVariable,
    bigintEnvironmentVariable
} from '../utils/environment-variable'
import {logCreateStakingPoolEvents} from '../utils/transaction-event-log'
import {getTimestampNow} from '../../test/framework/time'
import {RewardType} from '../../test/event/staking/staking-events'

async function createManagedStakingPool(
    mediatorAddress: string,
    creatorAddress: string,
    daoId: bigint,
    collateralTokensAddress: string
): Promise<void> {
    const mediatorFactory = await ethers.getContractFactory(
        'StakingPoolMediator'
    )
    const mediator = <StakingPoolMediator>(
        mediatorFactory.attach(mediatorAddress)
    )

    const creatorFactory = await ethers.getContractFactory('StakingPoolFactory')
    const creator = <StakingPoolMediator>creatorFactory.attach(creatorAddress)

    log.info('Creating a new managed staking pool..')

    const stakingPoolInfo = {
        daoId,
        minTotalPoolStake: 0,
        maxTotalPoolStake: 600,
        minimumContribution: 5,
        epochDuration: 100,
        epochStartTimestamp: await getTimestampNow(),
        emergencyMode: false,
        treasury: creatorAddress,
        stakeToken: collateralTokensAddress,
        rewardType: RewardType.FLOATING,
        rewardTokens: []
    }

    const transaction = await mediator.createManagedStakingPool(
        stakingPoolInfo,
        false,
        (await getTimestampNow()) + 86000
    )

    const receipt = await transaction.wait()

    log.info('Transaction complete with status %s', receipt.status)

    logCreateStakingPoolEvents(creator, receipt)
}

async function main(): Promise<void> {
    const creator = addressEnvironmentVariable('STAKING_POOL_FACTORY_ADDRESS')
    const mediator = addressEnvironmentVariable('STAKING_POOL_MEDIATOR_ADDRESS')
    const collateral = addressEnvironmentVariable('COLLATERAL_TOKENS_CONTRACT')
    const daoId = bigintEnvironmentVariable('DAO_ID')

    return createManagedStakingPool(mediator, creator, daoId, collateral)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
