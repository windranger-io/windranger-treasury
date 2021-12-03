const PAUSE_TIME_INCREMENT_MS = 100

/**
 * Whether the side effects being awaited have occurred.
 */
export interface SideEffectOccurrence {
    (): boolean
}

/**
 * Delays processing, with an early exit condition.
 *
 * @param earlyStop awaiting the side effect.
 * @param maximumDelayMs most amount of time to await side effect.
 */
export async function occurrenceAtMost(
    earlyStop: SideEffectOccurrence,
    maximumDelayMs: number
): Promise<void> {
    let passedMs = 0

    while (!earlyStop() && passedMs < maximumDelayMs) {
        await sleep(PAUSE_TIME_INCREMENT_MS)
        passedMs += PAUSE_TIME_INCREMENT_MS
    }
}

function sleep(ms: number): Promise<unknown> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}
