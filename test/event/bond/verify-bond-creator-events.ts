import {
    ActualBondMetaData,
    ActualBondSettings,
    ActualCreateBondEvent,
    ActualTimeLockRewardPool,
    createBondEventLogs,
    createBondEvents
} from './bond-creator-events'
import {events} from '../../framework/events'
import {ethers} from 'hardhat'
import {BaseContract, ContractReceipt} from 'ethers'
import {verifyOrderedEvents} from '../../framework/verify'
import {eventLog} from '../../framework/event-logs'

export type ExpectBondMetaData = {
    name: string
    symbol: string
    data: string
}

export type ExpectBondSettings = {
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

export type ExpectCreateBondEvent = {
    metadata: ExpectBondMetaData
    configuration: ExpectBondSettings
    rewards: ExpectTimeLockRewardPool[]
    treasury: string
    instigator: string
}

/**
 * Verifies the content for CreateBond events.
 */
export function verifyCreateBondEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectCreateBondEvent[]
): void {
    const actualEvents = createBondEvents(events('CreateBond', receipt))

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (actual: ActualCreateBondEvent, expected: ExpectCreateBondEvent) =>
            deepEqualsCreateBondEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected CreateBond events.
 */
export function verifyCreateBondEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectCreateBondEvent[]
): void {
    const actualEvents = createBondEventLogs(
        eventLog('CreateBond', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (actual: ActualCreateBondEvent, expected: ExpectCreateBondEvent) =>
            deepEqualsCreateBondEvent(actual, expected)
    )
}

function deepEqualsCreateBondEvent(
    actual: ActualCreateBondEvent,
    expected: ExpectCreateBondEvent
): boolean {
    return (
        ethers.utils.isAddress(actual.bond) &&
        actual.bond !== expected.instigator &&
        actual.bond !== expected.treasury &&
        actual.instigator === expected.instigator &&
        deepEqualsBondMetaData(actual.metadata, expected.metadata) &&
        deepEqualsBondSettings(actual.configuration, expected.configuration) &&
        deepEqualsTimeLockRewardPools(actual.rewards, expected.rewards)
    )
}

function deepEqualsBondMetaData(
    actual: ActualBondMetaData,
    expected: ExpectBondMetaData
): boolean {
    return (
        actual.name === expected.name &&
        actual.symbol === expected.symbol &&
        actual.data === expected.data
    )
}

function deepEqualsBondSettings(
    actual: ActualBondSettings,
    expected: ExpectBondSettings
): boolean {
    return (
        actual.debtTokenAmount.toBigInt() === expected.debtTokenAmount &&
        actual.collateralTokens === expected.collateralTokens &&
        actual.expiryTimestamp.toBigInt() === expected.expiryTimestamp &&
        actual.minimumDeposit.toBigInt() === expected.minimumDeposit
    )
}

function deepEqualsTimeLockRewardPools(
    actual: ActualTimeLockRewardPool[],
    expected: ExpectTimeLockRewardPool[]
): boolean {
    let i = 0
    let equality = expected.length === actual.length

    while (equality && i < expected.length) {
        equality = deepEqualsTimeLockRewardPool(actual[i], expected[i])
        i++
    }

    return equality
}

function deepEqualsTimeLockRewardPool(
    actual: ActualTimeLockRewardPool,
    expected: ExpectTimeLockRewardPool
): boolean {
    return (
        actual.amount.toBigInt() === expected.amount &&
        actual.tokens === expected.tokens &&
        actual.timeLock.toBigInt() === expected.timeLock
    )
}
