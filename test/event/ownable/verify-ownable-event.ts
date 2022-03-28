import {BaseContract, ContractReceipt} from 'ethers'
import {expect} from 'chai'
import {ownershipTransferredEventLogs} from './ownable-events'
import {eventLog} from '../../framework/event-logs'

/**
 * Verifies the content for ordered Ownership Transferred log events.
 */
export function verifyOwnershipTransferredEventLogs<T extends BaseContract>(
    expectedEvent: {
        previousOwner: string
        newOwner: string
    }[],
    emitter: T,
    receipt: ContractReceipt
): void {
    const events = ownershipTransferredEventLogs(
        eventLog('OwnershipTransferred', emitter, receipt)
    )

    expect(events.length).equals(expectedEvent.length)

    for (let i = 0; i < expectedEvent.length; i++) {
        expect(events[i]).to.deep.equal(expectedEvent[i])
    }
}
