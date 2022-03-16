import {depositEvent} from './floating-staking-events'
import {event} from '../../framework/events'
import {expect} from 'chai'
import {ethers} from 'hardhat'
import {BigNumber, ContractReceipt} from 'ethers'

export type ActualDepositEvent = {
    user: string
    depositAmount: BigNumber
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
