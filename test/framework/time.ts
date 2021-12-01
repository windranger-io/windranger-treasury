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
export async function delayUntil(
    earlyStop: SideEffectOccurrence,
    maximumDelayMs: number
): Promise<unknown> {
    const timeIncrementMs = 100
    let passedMs = 0

    while (!earlyStop() && maximumDelayMs < passedMs) {
        await delay(timeIncrementMs)
        passedMs += timeIncrementMs
    }
    return new Promise((resolve) => setTimeout(resolve, maximumDelayMs))
}

function delay(ms: number): Promise<unknown> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
