import {Event} from 'ethers'
import {DepositEvent, WithdrawEvent} from '../../../typechain-types/StakingPool'
import {expect} from 'chai'
import {ActualDepositEvent, ActualWithdrawEvent} from './verify-staking-events'

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
    const deposit = event as WithdrawEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.stake).is.not.undefined
    expect(args?.user).is.not.undefined
    return deposit.args
}
