import {
    ActualBondMetaData,
    ActualBondSettings,
    ActualCreateBondEvent,
    ActualTimeLockRewardPool,
    createBondEventLogs,
    createBondEvents
} from './bond-creator-events'
import {ethers} from 'hardhat'
import {BaseContract, ContractReceipt} from 'ethers'
import {
    parseEventLog,
    parseEvents,
    verifyOrderedEvents
} from '../../framework/verify'

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
    const actualEvents = parseEvents(receipt, 'CreateBond', createBondEvents)

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsCreateBondEvent)
}

/**
 * Verifies the event log entries contain the expected CreateBond events.
 */
export function verifyCreateBondEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectCreateBondEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'CreateBond',
        createBondEventLogs
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsCreateBondEvent)
}

function deepEqualsCreateBondEvent(
    expected: ExpectCreateBondEvent,
    actual: ActualCreateBondEvent
): boolean {
    return (
        ethers.utils.isAddress(actual.bond) &&
        actual.bond !== expected.instigator &&
        actual.bond !== expected.treasury &&
        actual.instigator === expected.instigator &&
        deepEqualsBondMetaData(expected.metadata, actual.metadata) &&
        deepEqualsBondSettings(expected.configuration, actual.configuration) &&
        deepEqualsTimeLockRewardPools(expected.rewards, actual.rewards)
    )
}

function deepEqualsBondMetaData(
    expected: ExpectBondMetaData,
    actual: ActualBondMetaData
): boolean {
    return (
        actual.name === expected.name &&
        actual.symbol === expected.symbol &&
        actual.data === expected.data
    )
}

function deepEqualsBondSettings(
    expected: ExpectBondSettings,
    actual: ActualBondSettings
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
