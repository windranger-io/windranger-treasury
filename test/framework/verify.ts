import {expect} from 'chai'
import {BaseContract, ContractReceipt, Event} from 'ethers'
import {eventLog} from './event-logs'
import {Result} from '@ethersproject/abi'
import {events} from './events'

export interface EventsDeepEqual<T, U> {
    (expected: T, actual: U): boolean
}

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
 * Verifies the content matches at least one of the Transfer events.
 */
export function verifyOrderedEvents<T, U>(
    expectedEvents: T[],
    actualEvents: U[],
    equality: EventsDeepEqual<T, U>
): void {
    let matches = 0
    let lastMatchIndex = -1

    /*
     * Matching entries are removed from actualEvents before the next loop.
     * Avoids the same event being matched twice.
     */
    for (const expectedEvent of expectedEvents) {
        let matchIndex = -1
        for (let i = 0; i < actualEvents.length; i++) {
            if (equality(expectedEvent, actualEvents[i])) {
                matchIndex = i
            }
        }
        if (matchIndex >= 0) {
            // Size of array reduces on match, hence >= and not >
            expect(
                matchIndex,
                'Actual events are in the wrong order'
            ).is.greaterThanOrEqual(lastMatchIndex)

            matches++
            actualEvents.splice(matchIndex, 1)
            lastMatchIndex = matchIndex
        }
    }

    expect(matches, 'Not all expected events were found').equals(
        expectedEvents.length
    )
}
