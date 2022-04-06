import {BigNumber, Event} from 'ethers'
import {StakingPoolCreatedEvent} from '../../../typechain-types/contracts/staking/StakingPoolFactory'
import {expect} from 'chai'
import {RewardType} from './staking-events'

type RewardToken = {
    tokens: string
}

export type ActualStakingPoolCreatedEvent = {
    stakingPool: string
    treasury: string
    creator: string
    rewardTokens: RewardToken[]
    stakeToken: string
    epochStartTimestamp: BigNumber
    epochDuration: BigNumber
    minimumContribution: BigNumber
    rewardType: RewardType
}

export type ExpectedStakingPoolCreatedEvent = {
    treasury: string
    creator: string
    rewardTokens: RewardToken[]
    stakeToken: string
    epochStartTimestamp: BigNumber
    epochDuration: BigNumber
    minimumContribution: BigNumber
    rewardType: RewardType
}

/**
 * Shape check and conversion for a StakingPoolCreated
 */
export function stakingPoolCreated(
    event: Event
): ActualStakingPoolCreatedEvent {
    const created = event as StakingPoolCreatedEvent
    expect(event.args).is.not.undefined

    const args = event.args

    expect(args?.stakingPool).is.not.undefined

    expect(args?.treasury).is.not.undefined

    expect(args?.creator).is.not.undefined

    expect(args?.rewardTokens).is.not.undefined
    expect(args?.stakeToken).is.not.undefined
    expect(args?.epochStartTimestamp).is.not.undefined
    expect(args?.epochDuration).is.not.undefined
    expect(args?.minimumContribution).is.not.undefined
    expect(args?.rewardType).is.not.undefined

    return created.args
}
