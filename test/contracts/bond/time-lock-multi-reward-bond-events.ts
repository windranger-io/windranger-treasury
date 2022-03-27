import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {BigNumber, Event} from 'ethers'
import {
    ClaimRewardEvent,
    RegisterRewardEvent,
    RewardDebtEvent,
    SetRedemptionTimestampEvent,
    UpdateRewardTimeLockEvent
} from '../../../typechain-types/TimeLockMultiRewardBond'

export type ActualClaimRewardEvent = {tokens: string; amount: BigNumber}

export type ActualRegisterRewardEvent = {
    tokens: string
    amount: BigNumber
    timeLock: BigNumber
}

export type ActualRewardDebtEvent = {
    tokens: string
    claimant: string
    rewardDebt: BigNumber
}

export type ActualSetRedemptionTimestampEvent = {timestamp: BigNumber}

export type ActualUpdateRewardTimeLockEvent = {
    tokens: string
    timeLock: BigNumber
}

/**
 * Shape check and conversion for a ClaimReward events.
 */
export function claimRewardEvents(events: Event[]): ActualClaimRewardEvent[] {
    const rewards: ActualClaimRewardEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const claimed = event as ClaimRewardEvent

        const args = claimed.args
        expect(args?.tokens).is.not.undefined
        expect(args?.amount).is.not.undefined

        rewards.push(claimed.args)
    }

    return rewards
}

/**
 * Shape check and conversion for a RegisterReward events.
 */
export function registerRewardEvents(
    events: Event[]
): ActualRegisterRewardEvent[] {
    const rewards: ActualRegisterRewardEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const reward = event as RegisterRewardEvent

        const args = reward.args
        expect(args?.tokens).is.not.undefined
        expect(args?.amount).is.not.undefined
        expect(args?.timeLock).is.not.undefined

        rewards.push(reward.args)
    }

    return rewards
}

/**
 * Shape check and conversion for a RewardDebt events.
 */
export function rewardDebtEvents(events: Event[]): ActualRewardDebtEvent[] {
    const rewards: ActualRewardDebtEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const debt = event as RewardDebtEvent

        const args = debt.args
        expect(args?.tokens).is.not.undefined
        expect(args?.claimant).is.not.undefined
        expect(args?.rewardDebt).is.not.undefined

        rewards.push(debt.args)
    }

    return rewards
}

/**
 * Shape check and conversion for a SetRedemptionTimestamp events.
 */
export function setRedemptionTimestampEvents(
    events: Event[]
): ActualSetRedemptionTimestampEvent[] {
    const rewards: ActualSetRedemptionTimestampEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const debt = event as SetRedemptionTimestampEvent

        const args = debt.args
        expect(args?.timestamp).is.not.undefined

        rewards.push(debt.args)
    }

    return rewards
}

/**
 * Shape check and conversion for a UpdateRewardTimeLock events.
 */
export function updateRewardTimeLockEvents(
    events: Event[]
): ActualUpdateRewardTimeLockEvent[] {
    const rewards: ActualUpdateRewardTimeLockEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const debt = event as UpdateRewardTimeLockEvent

        const args = debt.args
        expect(args?.tokens).is.not.undefined
        expect(args?.timeLock).is.not.undefined

        rewards.push(debt.args)
    }

    return rewards
}

/**
 * Shape check and conversion for an event log entry for ClaimReward event.
 */
export function claimRewardEventLogs(
    events: Result[]
): ActualClaimRewardEvent[] {
    const rewards: ActualClaimRewardEvent[] = []

    for (const event of events) {
        expect(event?.tokens).is.not.undefined
        expect(event?.tokens).to.be.a('string')
        expect(event?.amount).is.not.undefined

        rewards.push({
            tokens: String(event.tokens),
            amount: BigNumber.from(event.amount)
        })
    }

    return rewards
}

/**
 * Shape check and conversion for an event log entry for RegisterReward event.
 */
export function registerRewardEventLogs(
    events: Result[]
): ActualRegisterRewardEvent[] {
    const rewards: ActualRegisterRewardEvent[] = []

    for (const event of events) {
        expect(event?.tokens).is.not.undefined
        expect(event?.tokens).to.be.a('string')
        expect(event?.amount).is.not.undefined
        expect(event?.timeLock).is.not.undefined

        rewards.push({
            tokens: String(event.tokens),
            amount: BigNumber.from(event.amount),
            timeLock: BigNumber.from(event.timeLock)
        })
    }

    return rewards
}

/**
 * Shape check and conversion for an event log entry for RewardDebt event.
 */
export function rewardDebtEventLogs(events: Result[]): ActualRewardDebtEvent[] {
    const rewards: ActualRewardDebtEvent[] = []

    for (const event of events) {
        expect(event?.tokens).is.not.undefined
        expect(event?.tokens).to.be.a('string')
        expect(event?.claimant).is.not.undefined
        expect(event?.claimant).to.be.a('string')
        expect(event?.rewardDebt).is.not.undefined

        rewards.push({
            tokens: String(event.tokens),
            claimant: String(event.claimant),
            rewardDebt: BigNumber.from(event.rewardDebt)
        })
    }

    return rewards
}

/**
 * Shape check and conversion for an event log entry for SetRedemptionTimestamp event.
 */
export function setRedemptionTimestampEventLogs(
    events: Result[]
): ActualSetRedemptionTimestampEvent[] {
    const rewards: ActualSetRedemptionTimestampEvent[] = []

    for (const event of events) {
        expect(event?.timestamp).is.not.undefined

        rewards.push({
            timestamp: BigNumber.from(event.timestamp)
        })
    }

    return rewards
}

/**
 * Shape check and conversion for an event log entry for UpdateRewardTimeLock event.
 */
export function updateRewardTimeLockEventLogs(
    events: Result[]
): ActualUpdateRewardTimeLockEvent[] {
    const rewards: ActualUpdateRewardTimeLockEvent[] = []

    for (const event of events) {
        expect(event?.tokens).is.not.undefined
        expect(event?.tokens).to.be.a('string')
        expect(event?.timeLock).is.not.undefined

        rewards.push({
            tokens: String(event.tokens),
            timeLock: BigNumber.from(event.timeLock)
        })
    }

    return rewards
}
