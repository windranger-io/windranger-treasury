import {BigNumber, Event} from 'ethers'
import {StakingPoolCreatedEvent} from '../../../typechain-types/contracts/staking/StakingPoolFactory'
import {expect} from 'chai'
import {RewardType} from './staking-events'
import {Result} from '@ethersproject/abi'

type RewardToken = {
    tokens: string
}

export type ActualStakingPoolCreatedEvent = {
    stakingPool: string
    creator: string
    config: Config
}
type Config = {
    treasury: string
    rewardTokens: RewardToken[]
    stakeToken: string
    epochStartTimestamp: BigNumber
    epochDuration: BigNumber
    minimumContribution: BigNumber
    minTotalPoolStake: BigNumber
    maxTotalPoolStake: BigNumber
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
    minTotalPoolStake: BigNumber
    maxTotalPoolStake: BigNumber
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

    expect(args?.creator).is.not.undefined
    expect(args?.stakingPool).is.not.undefined

    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    expect(event?.args?.config?.treasury).is.not.undefined
    expect(event?.args?.config?.rewardTokens).is.not.undefined
    expect(event?.args?.config?.stakeToken).is.not.undefined
    expect(event?.args?.config?.epochStartTimestamp).is.not.undefined
    expect(event?.args?.config?.epochDuration).is.not.undefined
    expect(event?.args?.config?.minimumContribution).is.not.undefined
    expect(event?.args?.config?.rewardType).is.not.undefined
    expect(event?.args?.config?.minTotalPoolStake).is.not.undefined
    expect(event?.args?.config?.maxTotalPoolStake).is.not.undefined

    return {
        stakingPool: String(event?.args?.stakingPool),
        config: {
            treasury: String(event?.args?.config.treasury),
            rewardTokens: event?.args?.config.rewardTokens as RewardToken[],
            stakeToken: String(event?.args?.config.stakeToken),
            epochStartTimestamp: BigNumber.from(
                event?.args?.config.epochStartTimestamp
            ),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            epochDuration: BigNumber.from(event?.args?.config?.epochDuration),
            minTotalPoolStake: BigNumber.from(
                event?.args?.config.minTotalPoolStake
            ),
            maxTotalPoolStake: BigNumber.from(
                event?.args?.config.maxTotalPoolStake
            ),
            minimumContribution: BigNumber.from(
                event?.args?.config.minimumContribution
            ),
            rewardType: event?.args?.config.rewardType as RewardType
        },
        creator: String(event?.args?.creator)
    }
}

/**
 * Shape check and conversion for an event log entry for StakingPoolCreated
 */
export function stakingPoolCreatedEventLogs(
    events: Result[]
): ActualStakingPoolCreatedEvent[] {
    const results: ActualStakingPoolCreatedEvent[] = []

    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    for (const event of events) {
        expect(event?.stakingPool).is.not.undefined
        expect(event?.creator).is.not.undefined

        expect(event?.config?.minTotalPoolStake).is.not.undefined
        expect(event?.config.maxTotalPoolStake).is.not.undefined
        expect(event?.config.treasury).is.not.undefined
        expect(event?.config.rewardTokens).is.not.undefined
        expect(event?.config.stakeToken).is.not.undefined
        expect(event?.config.epochStartTimestamp).is.not.undefined
        expect(event?.config.epochDuration).is.not.undefined
        expect(event?.config.minimumContribution).is.not.undefined
        expect(event?.config.rewardType).is.not.undefined

        results.push({
            stakingPool: String(event.stakingPool),
            config: {
                treasury: String(event.config.treasury),
                rewardTokens: event?.config.rewardTokens as RewardToken[],
                stakeToken: String(event.config.stakeToken),
                epochStartTimestamp: BigNumber.from(
                    event.config.epochStartTimestamp
                ),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                epochDuration: BigNumber.from(event?.config?.epochDuration),
                minTotalPoolStake: BigNumber.from(
                    event?.config.minTotalPoolStake
                ),
                maxTotalPoolStake: BigNumber.from(
                    event?.config.maxTotalPoolStake
                ),
                minimumContribution: BigNumber.from(
                    event.config.minimumContribution
                ),
                rewardType: event?.config.rewardType as RewardType
            },
            creator: String(event.creator)
        })
    }

    return results
}
