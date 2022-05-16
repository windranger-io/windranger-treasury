import {fail} from 'assert'

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

            if (matchIndex < lastMatchIndex) {
                failWithMessage(
                    'Actual events are in the wrong order',
                    expectedEvents,
                    actualEvents
                )
            }

            matches++
            actualEvents.splice(matchIndex, 1)
            lastMatchIndex = matchIndex
        }
    }

    if (matches !== expectedEvents.length) {
        failWithMessage(
            'Not all expected events were found',
            expectedEvents,
            actualEvents
        )
    }
}

/**
 * Test framework fail with complex object output as pretty json
 */
function failWithMessage<T, U>(summary: string, expected: T, actual: U): void {
    fail(
        `${summary}\n\nExpected: ${prettyJson(
            expected
        )}\n\nActual: ${prettyJson(actual)}`
    )
}

/**
 * Converts an object (that may contain bigints) into a pretty JSON string,
 * with an indentation of two spaces.
 */
function prettyJson<T>(data: T): string {
    return JSON.stringify(data, stringifyBigInt, 2)
}

function stringifyBigInt<T, U, V>(key: T, value: U): string | U {
    return typeof value === 'bigint' ? value.toString() : value
}
