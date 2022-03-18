import {ethers} from 'hardhat'
const {provider} = ethers

const PAUSE_TIME_INCREMENT_MS = 100

export const DAY_IN_SECONDS = 60 * 60 * 24

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

export async function getTimestampNow(): Promise<number> {
    return (await provider.getBlock('latest')).timestamp
}

export function advanceBlock() {
    return provider.send('evm_mine', [])
}

export const increaseTime = async (time: number, advance = true) => {
    await provider.send('evm_increaseTime', [time])
    if (advance) {
        await advanceBlock()
    }
}

export async function setTime(time: number, advance = true) {
    await provider.send('evm_setNextBlockTimestamp', [time])
    if (advance) {
        await advanceBlock()
    }
}

function sleep(ms: number): Promise<unknown> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

export function currentTimeInSeconds(): number {
    return Math.floor(Date.now() / 1000)
}
