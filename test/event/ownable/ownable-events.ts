/**
 * Events for an OpenZeppelin ownable contract.
 */

import {Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {OwnershipTransferredEvent} from '../../../typechain-types/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable'

type OwnershipTransfer = {
    previousOwner: string
    newOwner: string
}

/**
 * Shape check and conversion for an Ownership Transfer Event.
 */
export function ownershipTransferredEvent(event: Event): OwnershipTransfer {
    const transfer = event as OwnershipTransferredEvent
    expect(transfer.args).is.not.undefined

    const args = transfer.args
    expect(args?.previousOwner).is.not.undefined
    expect(args?.newOwner).is.not.undefined

    return args
}

/**
 * Shape check and conversion for a event log entry for an Ownership Transfer Event.
 */
export function ownershipTransferredEventLogs(
    events: Result
): OwnershipTransfer[] {
    const results: OwnershipTransfer[] = []

    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    for (const event of events) {
        expect(event?.previousOwner).is.not.undefined
        expect(event?.previousOwner).to.be.a('string')

        expect(event?.newOwner).is.not.undefined
        expect(event?.newOwner).to.be.a('string')

        results.push({
            previousOwner: String(event?.previousOwner),
            newOwner: String(event?.newOwner)
        })
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */

    return results
}
