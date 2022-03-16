import {Event} from 'ethers'
import {DepositEvent} from '../../../typechain-types/FloatingStakingPool'
import {expect} from 'chai'
import {ActualDepositEvent} from './verify-staking-events'

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
