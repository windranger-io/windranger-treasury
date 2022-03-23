import {
    depositEvent,
    withdrawEvent,
    withdrawRewardsEvent
} from './staking-events'
import {event} from '../../framework/events'
import {expect} from 'chai'
import {BigNumber, ContractReceipt} from 'ethers'

export type ActualDepositEvent = {
    user: string
    depositAmount: BigNumber
}
export type ActualWithdrawEvent = {
    user: string
    stake: BigNumber
}
export type ActualWithdrawRewardsEvent = {
    user: string
    rewardToken: string
    rewards: BigNumber
}

export function verifyDepositEvent(
    expected: ActualDepositEvent,
    receipt: ContractReceipt
) {
    const actualDepositEvent: ActualDepositEvent = depositEvent(
        event('Deposit', receipt)
    )
    expect(actualDepositEvent.user).equals(expected.user)
    expect(actualDepositEvent.depositAmount).equals(expected.depositAmount)
}

export function verifyWithdrawEvent(
    expected: ActualWithdrawEvent,
    receipt: ContractReceipt
) {
    const actualWithdrawEvent: ActualWithdrawEvent = withdrawEvent(
        event('WithdrawStake', receipt)
    )
    expect(actualWithdrawEvent.user).equals(expected.user)
    expect(actualWithdrawEvent.stake).equals(expected.stake)
}

export function verifyWithdrawRewardsEvent(
    expected: ActualWithdrawRewardsEvent,
    receipt: ContractReceipt
) {
    const actualWithdrawRewardsEvent: ActualWithdrawRewardsEvent =
        withdrawRewardsEvent(event('WithdrawRewards', receipt))
    expect(actualWithdrawRewardsEvent.user).equals(expected.user)
    expect(actualWithdrawRewardsEvent.rewardToken).equals(expected.rewardToken)
    expect(actualWithdrawRewardsEvent.rewards).equals(expected.rewards)
}
