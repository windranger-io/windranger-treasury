import {ContractReceipt, Event} from 'ethers'
import {expect} from 'chai'

/**
 * Retrieves an event that matches the given name, failing if not present.
 *
 * @param name  name of the event expected within the given contracts.
 * @param events contracts expected to contain an exact match for the given name.
 */
export function event(name: string, events: Event[]): Event {
    for (let i = 0; i < events.length; i++) {
        if (events[i]?.event === name) return events[i]
    }

    expect.fail('Failed to find event matching name: ' + name)
}

/**
 * Checks the shape of the event array, failing when expectation are not met.
 */
export function events(receipt: ContractReceipt): Event[] {
    expect(receipt.events).is.not.undefined
    const events = receipt.events
    expect(events).is.not.undefined
    return events ? events : []
}
