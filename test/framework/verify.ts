import {expect} from 'chai'

export interface EventsDeepEqual<T, U> {
    (expected: T, actual: U): boolean
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
