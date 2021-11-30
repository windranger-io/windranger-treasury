import {ContractReceipt} from 'ethers'
import {event} from '../../framework/events'
import {expect} from 'chai'
import {ethers} from 'hardhat'
import {ownershipTransferredEvent} from './ownable-events'

/**
 * Verifies the content for a Ownership Transferred event.
 */
export async function verifyOwnershipTransferredEvent(
    expected: {
        previousOwner: string
        newOwner: string
    },
    receipt: ContractReceipt
): Promise<void> {
    const ownership = ownershipTransferredEvent(
        event('OwnershipTransferred', receipt)
    )
    expect(ethers.utils.isAddress(ownership.previousOwner)).is.true
    expect(ethers.utils.isAddress(ownership.newOwner)).is.true

    expect(ownership.previousOwner).equals(expected.previousOwner)
    expect(ownership.newOwner).equals(expected.newOwner)
}
