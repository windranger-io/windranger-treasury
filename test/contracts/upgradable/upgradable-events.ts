/**
 * Events for an OpenZeppelin upgradeable contract.
 */
import {
    AdminChangedEvent,
    UpgradedEvent
} from '../../../typechain/UUPSUpgradeable'
import {Event} from 'ethers'
import {expect} from 'chai'

/**
 * Shape check and conversion for a Admin Proxy's UpgradedEvent.
 */
export function upgradedEvent(event: Event): {implementation: string} {
    const upgrade = event as UpgradedEvent
    expect(upgrade.args).is.not.undefined

    const args = upgrade.args
    expect(args?.implementation).is.not.undefined

    return args
}

/**
 * Shape check and conversion for a Admin Proxy's UpgradedEvent.
 */
export function adminChangedEvent(event: Event): {
    previousAdmin: string
    newAdmin: string
} {
    const admin = event as AdminChangedEvent
    expect(admin.args).is.not.undefined

    const args = admin.args
    expect(args?.previousAdmin).is.not.undefined
    expect(args?.newAdmin).is.not.undefined

    return args
}
