import {depositEvent, withdrawEvent} from './floating-staking-events'
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
        event('Withdraw', receipt)
    )
    expect(actualWithdrawEvent.user).equals(expected.user)
    expect(actualWithdrawEvent.stake).equals(expected.stake)
}
