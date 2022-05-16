import {BaseContract, ContractReceipt} from 'ethers'
import {events, parseEventLog, parseEvents} from '../../framework/events'
import {verifyOrderedEvents} from '../../framework/verify'
import {eventLog} from '../../framework/event-logs'
import {
    ActualClaimRewardEvent,
    ActualRegisterRewardEvent,
    ActualRewardDebtEvent,
    ActualRedemptionTimestampUpdateEvent,
    ActualRewardTimeLockUpdateEvent,
    claimRewardEventLogs,
    claimRewardEvents,
    registerRewardEventLogs,
    registerRewardEvents,
    rewardDebtEventLogs,
    rewardDebtEvents,
    redemptionTimestampUpdateEventLogs,
    redemptionTimestampUpdateEvents,
    rewardTimeLockUpdateEventLogs,
    rewardTimeLockUpdateEvents
} from './time-lock-multi-reward-bond-events'

export type ExpectedClaimRewardEvent = {
    tokens: string
    amount: bigint
    instigator: string
}

export type ExpectedRegisterRewardEvent = {
    tokens: string
    amount: bigint
    timeLock: bigint
    instigator: string
}

export type ExpectedRewardDebtEvent = {
    tokens: string
    claimant: string
    rewardDebt: bigint
    instigator: string
}

export type ExpectedRedemptionTimestampUpdateEvent = {
    timestamp: bigint
    instigator: string
}

export type ExpectedRewardTimeLockUpdateEvent = {
    tokens: string
    timeLock: bigint
    instigator: string
}

/**
 * Verifies the content for ClaimReward events.
 */
export function verifyClaimRewardEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedClaimRewardEvent[]
): void {
    const actualEvents = parseEvents(receipt, 'ClaimReward', claimRewardEvents)

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsClaimRewardEvent
    )
}

/**
 * Verifies the event log entries contain the expected ClaimReward events.
 */
export function verifyClaimRewardLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedClaimRewardEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'ClaimReward',
        claimRewardEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsClaimRewardEvent
    )
}

/**
 * Verifies the content for RegisterReward events.
 */
export function verifyRegisterRewardEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedRegisterRewardEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'RegisterReward',
        registerRewardEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsRegisterRewardEvent
    )
}

/**
 * Verifies the event log entries contain the expected RegisterReward events.
 */
export function verifyRegisterRewardLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedRegisterRewardEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'RegisterReward',
        registerRewardEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsRegisterRewardEvent
    )
}

/**
 * Verifies the content for RewardDebt events.
 */
export function verifyRewardDebtEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedRewardDebtEvent[]
): void {
    const actualEvents = parseEvents(receipt, 'RewardDebt', rewardDebtEvents)

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsRewardDebtEvent)
}

/**
 * Verifies the event log entries contain the expected RewardDebt events.
 */
export function verifyRewardDebtLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectedRewardDebtEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'RewardDebt',
        rewardDebtEventLogs
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsRewardDebtEvent)
}

/**
 * Verifies the content for RedemptionTimestampUpdate events.
 */
export function verifyRedemptionTimestampUpdateEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedRedemptionTimestampUpdateEvent[]
): void {
    const actualEvents = redemptionTimestampUpdateEvents(
        events('RedemptionTimestampUpdate', receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectedRedemptionTimestampUpdateEvent,
            actual: ActualRedemptionTimestampUpdateEvent
        ) => deepEqualsRedemptionTimestampUpdateEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected SetRedemptionTimestamp events.
 */
export function verifyRedemptionTimestampUpdateLogEvents<
    T extends BaseContract
>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvent: ExpectedRedemptionTimestampUpdateEvent[]
): void {
    const actualEvents = redemptionTimestampUpdateEventLogs(
        eventLog('RedemptionTimestampUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvent,
        actualEvents,
        (
            expected: ExpectedRedemptionTimestampUpdateEvent,
            actual: ActualRedemptionTimestampUpdateEvent
        ) => deepEqualsRedemptionTimestampUpdateEvent(expected, actual)
    )
}

/**
 * Verifies the content for SetRedemptionTimestamp events.
 */
export function verifyRewardTimeLockUpdateEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedRewardTimeLockUpdateEvent[]
): void {
    const actualEvents = rewardTimeLockUpdateEvents(
        events('RewardTimeLockUpdate', receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectedRewardTimeLockUpdateEvent,
            actual: ActualRewardTimeLockUpdateEvent
        ) => deepEqualsRewardTimeLockUpdateEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected SetRedemptionTimestamp events.
 */
export function verifyRewardTimeLockUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvent: ExpectedRewardTimeLockUpdateEvent[]
): void {
    const actualEvents = rewardTimeLockUpdateEventLogs(
        eventLog('RewardTimeLockUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvent,
        actualEvents,
        (
            expected: ExpectedRewardTimeLockUpdateEvent,
            actual: ActualRewardTimeLockUpdateEvent
        ) => deepEqualsRewardTimeLockUpdateEvent(expected, actual)
    )
}

function deepEqualsClaimRewardEvent(
    expected: ExpectedClaimRewardEvent,
    actual: ActualClaimRewardEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.amount.toBigInt() === expected.amount &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsRegisterRewardEvent(
    expected: ExpectedRegisterRewardEvent,
    actual: ActualRegisterRewardEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.amount.toBigInt() === expected.amount &&
        actual.timeLock.toBigInt() === expected.timeLock &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsRewardDebtEvent(
    expected: ExpectedRewardDebtEvent,
    actual: ActualRewardDebtEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.claimant === expected.claimant &&
        actual.rewardDebt.toBigInt() === expected.rewardDebt &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsRedemptionTimestampUpdateEvent(
    expected: ExpectedRedemptionTimestampUpdateEvent,
    actual: ActualRedemptionTimestampUpdateEvent
): boolean {
    return (
        actual.timestamp.toBigInt() === expected.timestamp &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsRewardTimeLockUpdateEvent(
    expected: ExpectedRewardTimeLockUpdateEvent,
    actual: ActualRewardTimeLockUpdateEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.timeLock.toBigInt() === expected.timeLock &&
        actual.instigator === expected.instigator
    )
}
