import {ContractReceipt} from 'ethers'
import {event} from '../../framework/events'
import {expect} from 'chai'
import {ethers} from 'hardhat'
import {adminChangedEvent, upgradedEvent} from './upgradable-events'

/**
 * Verifies the content for a Upgraded event.
 */
export function verifyUpgradedEvent(
    expected: {
        implementation: string
    },
    receipt: ContractReceipt
): void {
    const upgrade = upgradedEvent(event('Upgraded', receipt))
    expect(ethers.utils.isAddress(upgrade.implementation)).is.true

    expect(upgrade.implementation).equals(expected.implementation)
}

/**
 * Verifies the content for a Admin Changed event.
 */
export function verifyAdminChangedEvent(
    expected: {
        previousAdmin: string
        newAdmin: string
    },
    receipt: ContractReceipt
): void {
    const creationEvent = adminChangedEvent(event('AdminChanged', receipt))
    expect(ethers.utils.isAddress(creationEvent.previousAdmin)).is.true
    expect(ethers.utils.isAddress(creationEvent.newAdmin)).is.true

    expect(creationEvent.previousAdmin).equals(expected.previousAdmin)
    expect(creationEvent.newAdmin).equals(expected.newAdmin)
}
