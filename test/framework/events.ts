import {BaseContract, ContractReceipt, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {eventLog} from './event-logs'

export interface EventsParser<T> {
    (loggedEvents: Event[]): T[]
}
export interface EventLogParser<T> {
    (loggedEvents: Result[]): T[]
}

/**
 * Inflates any found events who name match.
 *
 * @param receipt events matching the given event name.
 * @param eventName name of the event expected within the given contracts.
 * @param parse parser to inflate any found matching events,
 */
export function parseEvents<T>(
    receipt: ContractReceipt,
    eventName: string,
    parse: EventsParser<T>
): T[] {
    return parse(events(eventName, receipt))
}

/**
 * Inflates any found events in the event log when their name matches.
 *
 * @param emitter contract that emits the event and provide decoding of the event log.
 * @param receipt events matching the given event name.
 * @param eventName name of the event expected within the given contracts.
 * @param parse parser to inflate any found matching events,
 */
export function parseEventLog<T extends BaseContract, U>(
    emitter: T,
    receipt: ContractReceipt,
    eventName: string,
    parse: EventLogParser<U>
): U[] {
    return parse(eventLog(eventName, emitter, receipt))
}

/**
 * Retrieves a single events that matches the given name, failing if not present.
 *
 * @param name  name of the event expected within the given contracts.
 * @param receipt expected to contain the events matching the given name.
 */
export function event(name: string, receipt: ContractReceipt): Event {
    const found = events(name, receipt)
    expect(found.length, 'Expecting a single Event').equals(1)
    return found[0]
}

/**
 * Retrieves any events that matches the given name, failing if not present.
 *
 * @param name  name of the event(s) expected within the given contracts.
 * @param receipt expected to contain the events matching the given name.
 */
export function events(name: string, receipt: ContractReceipt): Event[] {
    const availableEvents = receiptEvents(receipt)
    const found = filterEvents(name, availableEvents)

    expect(
        found.length,
        'Failed to find any event matching name: ' + name
    ).is.greaterThan(0)

    return found
}

/**
 * The number of events with the given name.
 *
 * @param name  name of the event(s) expected within the given contracts.
 * @param receipt expected to contain the events matching the given name.
 */
export function countEvents(name: string, receipt: ContractReceipt): number {
    const availableEvents = receiptEvents(receipt)
    const found = filterEvents(name, availableEvents)

    return found.length
}

/**
 * Checks the shape of the event array, failing when expectation are not met.
 */
function receiptEvents(receipt: ContractReceipt): Event[] {
    expect(receipt.events, 'No receipt events').is.not.undefined
    const availableEvents = receipt.events
    expect(availableEvents, 'Receipt events are undefined').is.not.undefined
    return availableEvents ? availableEvents : []
}

function filterEvents(name: string, availableEvents: Event[]) {
    const found = []

    for (let i = 0; i < availableEvents.length; i++) {
        if (availableEvents[i]?.event === name) {
            found.push(availableEvents[i])
        }
    }

    return found
}
