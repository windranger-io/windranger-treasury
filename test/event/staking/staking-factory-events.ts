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
    epochStartTimestamp: number
    epochDuration: number
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

    expect(event?.args?.treasury).is.not.undefined
    expect(event?.args?.rewardTokens).is.not.undefined
    expect(event?.args?.stakeToken).is.not.undefined
    expect(event?.args?.epochStartTimestamp).is.not.undefined
    expect(event?.args?.epochDuration).is.not.undefined
    expect(event?.args?.minimumContribution).is.not.undefined
    expect(event?.args?.rewardType).is.not.undefined
    expect(event?.args?.minTotalPoolStake).is.not.undefined
    expect(event?.args?.maxTotalPoolStake).is.not.undefined

    return created.args
}

/**
 * Shape check and conversion for an event log entry for StakingPoolCreated
 */
export function stakingPoolCreatedEventLogs(
    events: Result[]
): ActualStakingPoolCreatedEvent[] {
    const results: ActualStakingPoolCreatedEvent[] = []

    for (const event of events) {
        expect(event?.stakingPool).is.not.undefined
        expect(event?.creator).is.not.undefined

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(event?.config?.minTotalPoolStake).is.not.undefined
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(event?.config.maxTotalPoolStake).is.not.undefined
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(event?.config.treasury).is.not.undefined
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(event?.config.rewardTokens).is.not.undefined
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(event?.config.stakeToken).is.not.undefined
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(event?.config.epochStartTimestamp).is.not.undefined
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(event?.config.epochDuration).is.not.undefined
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(event?.config.minimumContribution).is.not.undefined
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(event?.config.rewardType).is.not.undefined

        results.push({
            stakingPool: String(event.stakingPool),
            config: {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                treasury: String(event.config.treasury),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                rewardTokens: event?.config.rewardTokens as RewardToken[],
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                stakeToken: String(event.config.stakeToken),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                epochStartTimestamp: Number(event.config.epochStartTimestamp),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                epochDuration: Number(event.config.epochDuration),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                minTotalPoolStake: BigNumber.from(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    event?.config.minTotalPoolStake
                ),
                maxTotalPoolStake: BigNumber.from(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    event?.config.maxTotalPoolStake
                ),
                minimumContribution: BigNumber.from(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    event.config.minimumContribution
                ),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                rewardType: event?.config.rewardType as RewardType
            },
            creator: String(event.creator)
        })
    }

    return results
}
