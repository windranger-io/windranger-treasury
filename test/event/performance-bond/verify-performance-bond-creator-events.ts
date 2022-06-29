import {
    ActualPerformanceBondMetaData,
    ActualPerformanceBondSettings,
    ActualCreatePerformanceBondEvent,
    ActualTimeLockRewardPool,
    createPerformanceBondEventLogs,
    createPerformanceBondEvents
} from './performance-bond-creator-events'
import {ethers} from 'hardhat'
import {BaseContract, ContractReceipt} from 'ethers'
import {verifyOrderedEvents} from '../../framework/verify'
import {parseEventLog, parseEvents} from '../../framework/events'

export type ExpectPerformanceBondMetaData = {
    name: string
    symbol: string
    data: string
}

export type ExpectPerformanceBondSettings = {
    debtTokenAmount: bigint
    collateralTokens: string
    expiryTimestamp: bigint
    minimumDeposit: bigint
}

export type ExpectTimeLockRewardPool = {
    tokens: string
    amount: bigint
    timeLock: bigint
}

export type ExpectCreatePerformanceBondEvent = {
    metadata: ExpectPerformanceBondMetaData
    configuration: ExpectPerformanceBondSettings
    rewards: ExpectTimeLockRewardPool[]
    treasury: string
    instigator: string
}

/**
 * Verifies the content for CreatePerformanceBond events.
 */
export function verifyCreatePerformanceBondEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectCreatePerformanceBondEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'CreatePerformanceBond',
        createPerformanceBondEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsCreatePerformanceBondEvent
    )
}

/**
 * Verifies the event log entries contain the expected CreatePerformanceBond events.
 */
export function verifyCreatePerformanceBondEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectCreatePerformanceBondEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'CreatePerformanceBond',
        createPerformanceBondEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsCreatePerformanceBondEvent
    )
}

function deepEqualsCreatePerformanceBondEvent(
    expected: ExpectCreatePerformanceBondEvent,
    actual: ActualCreatePerformanceBondEvent
): boolean {
    return (
        ethers.utils.isAddress(actual.bond) &&
        actual.bond !== expected.instigator &&
        actual.bond !== expected.treasury &&
        actual.instigator === expected.instigator &&
        deepEqualsPerformanceBondMetaData(expected.metadata, actual.metadata) &&
        deepEqualsPerformanceBondSettings(
            expected.configuration,
            actual.configuration
        ) &&
        deepEqualsTimeLockRewardPools(expected.rewards, actual.rewards)
    )
}

function deepEqualsPerformanceBondMetaData(
    expected: ExpectPerformanceBondMetaData,
    actual: ActualPerformanceBondMetaData
): boolean {
    return (
        actual.name === expected.name &&
        actual.symbol === expected.symbol &&
        actual.data === expected.data
    )
}

function deepEqualsPerformanceBondSettings(
    expected: ExpectPerformanceBondSettings,
    actual: ActualPerformanceBondSettings
): boolean {
    return (
        actual.debtTokenAmount.toBigInt() === expected.debtTokenAmount &&
        actual.collateralTokens === expected.collateralTokens &&
        actual.expiryTimestamp.toBigInt() === expected.expiryTimestamp &&
        actual.minimumDeposit.toBigInt() === expected.minimumDeposit
    )
}

function deepEqualsTimeLockRewardPools(
    expected: ExpectTimeLockRewardPool[],
    actual: ActualTimeLockRewardPool[]
): boolean {
    let i = 0
    let equality = expected.length === actual.length

    while (equality && i < expected.length) {
        equality = deepEqualsTimeLockRewardPool(expected[i], actual[i])
        i++
    }

    return equality
}

function deepEqualsTimeLockRewardPool(
    expected: ExpectTimeLockRewardPool,
    actual: ActualTimeLockRewardPool
): boolean {
    return (
        actual.amount.toBigInt() === expected.amount &&
        actual.tokens === expected.tokens &&
        actual.timeLock.toBigInt() === expected.timeLock
    )
}
