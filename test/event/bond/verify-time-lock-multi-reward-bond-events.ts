import {BaseContract, ContractReceipt} from 'ethers'
import {events} from '../../framework/events'
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
    const actualEvents = claimRewardEvents(events('ClaimReward', receipt))

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (actual: ActualClaimRewardEvent, expected: ExpectedClaimRewardEvent) =>
            deepEqualsClaimRewardEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected ClaimReward events.
 */
export function verifyClaimRewardLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvent: ExpectedClaimRewardEvent[]
): void {
    const actualEvents = claimRewardEventLogs(
        eventLog('ClaimReward', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvent,
        (actual: ActualClaimRewardEvent, expected: ExpectedClaimRewardEvent) =>
            deepEqualsClaimRewardEvent(actual, expected)
    )
}

/**
 * Verifies the content for RegisterReward events.
 */
export function verifyRegisterRewardEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedRegisterRewardEvent[]
): void {
    const actualEvents = registerRewardEvents(events('RegisterReward', receipt))

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualRegisterRewardEvent,
            expected: ExpectedRegisterRewardEvent
        ) => deepEqualsRegisterRewardEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected RegisterReward events.
 */
export function verifyRegisterRewardLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvent: ExpectedRegisterRewardEvent[]
): void {
    const actualEvents = registerRewardEventLogs(
        eventLog('RegisterReward', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvent,
        (
            actual: ActualRegisterRewardEvent,
            expected: ExpectedRegisterRewardEvent
        ) => deepEqualsRegisterRewardEvent(actual, expected)
    )
}

/**
 * Verifies the content for RewardDebt events.
 */
export function verifyRewardDebtEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedRewardDebtEvent[]
): void {
    const actualEvents = rewardDebtEvents(events('RewardDebt', receipt))

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (actual: ActualRewardDebtEvent, expected: ExpectedRewardDebtEvent) =>
            deepEqualsRewardDebtEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected RewardDebt events.
 */
export function verifyRewardDebtLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvent: ExpectedRewardDebtEvent[]
): void {
    const actualEvents = rewardDebtEventLogs(
        eventLog('RewardDebt', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvent,
        (actual: ActualRewardDebtEvent, expected: ExpectedRewardDebtEvent) =>
            deepEqualsRewardDebtEvent(actual, expected)
    )
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
        actualEvents,
        expectedEvents,
        (
            actual: ActualRedemptionTimestampUpdateEvent,
            expected: ExpectedRedemptionTimestampUpdateEvent
        ) => deepEqualsRedemptionTimestampUpdateEvent(actual, expected)
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
        actualEvents,
        expectedEvent,
        (
            actual: ActualRedemptionTimestampUpdateEvent,
            expected: ExpectedRedemptionTimestampUpdateEvent
        ) => deepEqualsRedemptionTimestampUpdateEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (
            actual: ActualRewardTimeLockUpdateEvent,
            expected: ExpectedRewardTimeLockUpdateEvent
        ) => deepEqualsRewardTimeLockUpdateEvent(actual, expected)
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
        actualEvents,
        expectedEvent,
        (
            actual: ActualRewardTimeLockUpdateEvent,
            expected: ExpectedRewardTimeLockUpdateEvent
        ) => deepEqualsRewardTimeLockUpdateEvent(actual, expected)
    )
}

function deepEqualsClaimRewardEvent(
    actual: ActualClaimRewardEvent,
    expected: ExpectedClaimRewardEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.amount.toBigInt() === expected.amount &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsRegisterRewardEvent(
    actual: ActualRegisterRewardEvent,
    expected: ExpectedRegisterRewardEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.amount.toBigInt() === expected.amount &&
        actual.timeLock.toBigInt() === expected.timeLock &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsRewardDebtEvent(
    actual: ActualRewardDebtEvent,
    expected: ExpectedRewardDebtEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.claimant === expected.claimant &&
        actual.rewardDebt.toBigInt() === expected.rewardDebt &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsRedemptionTimestampUpdateEvent(
    actual: ActualRedemptionTimestampUpdateEvent,
    expected: ExpectedRedemptionTimestampUpdateEvent
): boolean {
    return (
        actual.timestamp.toBigInt() === expected.timestamp &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsRewardTimeLockUpdateEvent(
    actual: ActualRewardTimeLockUpdateEvent,
    expected: ExpectedRewardTimeLockUpdateEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.timeLock.toBigInt() === expected.timeLock &&
        actual.instigator === expected.instigator
    )
}
