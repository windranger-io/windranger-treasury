import {Event} from 'ethers'
import {
    DepositEvent,
    WithdrawStakeEvent,
    WithdrawRewardsEvent
} from '../../../typechain-types/StakingPool'
import {expect} from 'chai'
import {
    ActualDepositEvent,
    ActualWithdrawEvent,
    ActualWithdrawRewardsEvent
} from './verify-staking-events'

/**
 * Shape check and conversion for a DepositEvent
 */
export function depositEvent(event: Event): ActualDepositEvent {
    const deposit = event as DepositEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.depositAmount).is.not.undefined
    expect(args?.user).is.not.undefined
    return deposit.args
}

/**
 * Shape check and conversion for a WithdrawEvent
 */
export function withdrawEvent(event: Event): ActualWithdrawEvent {
    const withdrawal = event as WithdrawStakeEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.stake).is.not.undefined
    expect(args?.user).is.not.undefined
    return withdrawal.args
}

/**
 * Shape check and conversion for a WithdrawRewardsEvent
 */
export function withdrawRewardsEvent(event: Event): ActualWithdrawRewardsEvent {
    const rewardsEvent = event as WithdrawRewardsEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.rewardToken).is.not.undefined
    expect(args?.rewards).is.not.undefined
    expect(args?.user).is.not.undefined
    return rewardsEvent.args
}
