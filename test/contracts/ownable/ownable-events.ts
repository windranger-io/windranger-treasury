/**
 * Events for an OpenZeppelin ownable contract.
 */

import {Event} from 'ethers'
import {expect} from 'chai'
import {OwnershipTransferredEvent} from '../../../typechain/OwnableUpgradeable'

/**
 * Shape check and conversion for a Ownership Transfer Event.
 */
export function ownershipTransferredEvent(event: Event): {
    previousOwner: string
    newOwner: string
} {
    const transfer = event as OwnershipTransferredEvent
    expect(transfer.args).is.not.undefined

    const args = transfer.args
    expect(args?.previousOwner).is.not.undefined
    expect(args?.newOwner).is.not.undefined

    return args
}
