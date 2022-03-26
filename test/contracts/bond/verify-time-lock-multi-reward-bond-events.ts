import {BaseContract, ContractReceipt} from 'ethers'
import {events} from '../../framework/events'
import {verifyOrderedEvents} from '../../framework/verify'
import {eventLog} from '../../framework/event-logs'
import {
    ActualClaimRewardEvent,
    ActualRegisterRewardEvent,
    ActualRewardDebtEvent,
    ActualSetRedemptionTimestampEvent,
    ActualUpdateRewardTimeLockEvent,
    claimRewardEventLogs,
    claimRewardEvents,
    registerRewardEventLogs,
    registerRewardEvents,
    rewardDebtEventLogs,
    rewardDebtEvents,
    setRedemptionTimestampEventLogs,
    setRedemptionTimestampEvents,
    updateRewardTimeLockEventLogs,
    updateRewardTimeLockEvents
} from './time-lock-multi-reward-bond-events'

export type ExpectedClaimRewardEvent = {tokens: string; amount: bigint}

export type ExpectedRegisterRewardEvent = {
    tokens: string
    amount: bigint
    timeLock: bigint
}

export type ExpectedRewardDebtEvent = {
    tokens: string
    claimant: string
    rewardDebt: bigint
}

export type ExpectedSetRedemptionTimestampEvent = {timestamp: bigint}

export type ExpectedUpdateRewardTimeLockEvent = {
    tokens: string
    timeLock: bigint
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
 * Verifies the content for SetRedemptionTimestamp events.
 */
export function verifySetRedemptionTimestampEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedSetRedemptionTimestampEvent[]
): void {
    const actualEvents = setRedemptionTimestampEvents(
        events('SetRedemptionTimestamp', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualSetRedemptionTimestampEvent,
            expected: ExpectedSetRedemptionTimestampEvent
        ) => deepEqualsSetRedemptionTimestampEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected SetRedemptionTimestamp events.
 */
export function verifySetRedemptionTimestampLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvent: ExpectedSetRedemptionTimestampEvent[]
): void {
    const actualEvents = setRedemptionTimestampEventLogs(
        eventLog('SetRedemptionTimestamp', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvent,
        (
            actual: ActualSetRedemptionTimestampEvent,
            expected: ExpectedSetRedemptionTimestampEvent
        ) => deepEqualsSetRedemptionTimestampEvent(actual, expected)
    )
}

/**
 * Verifies the content for SetRedemptionTimestamp events.
 */
export function verifyUpdateRewardTimeLockpEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectedUpdateRewardTimeLockEvent[]
): void {
    const actualEvents = updateRewardTimeLockEvents(
        events('UpdateRewardTimeLock', receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvents,
        (
            actual: ActualUpdateRewardTimeLockEvent,
            expected: ExpectedUpdateRewardTimeLockEvent
        ) => deepEqualsUpdateRewardTimeLockEvent(actual, expected)
    )
}

/**
 * Verifies the event log entries contain the expected SetRedemptionTimestamp events.
 */
export function verifySetUpdateRewardTimeLockLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvent: ExpectedUpdateRewardTimeLockEvent[]
): void {
    const actualEvents = updateRewardTimeLockEventLogs(
        eventLog('UpdateRewardTimeLock', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        expectedEvent,
        (
            actual: ActualUpdateRewardTimeLockEvent,
            expected: ExpectedUpdateRewardTimeLockEvent
        ) => deepEqualsUpdateRewardTimeLockEvent(actual, expected)
    )
}

function deepEqualsClaimRewardEvent(
    actual: ActualClaimRewardEvent,
    expected: ExpectedClaimRewardEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.amount.toBigInt() === expected.amount
    )
}

function deepEqualsRegisterRewardEvent(
    actual: ActualRegisterRewardEvent,
    expected: ExpectedRegisterRewardEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.amount.toBigInt() === expected.amount &&
        actual.timeLock.toBigInt() === expected.timeLock
    )
}

function deepEqualsRewardDebtEvent(
    actual: ActualRewardDebtEvent,
    expected: ExpectedRewardDebtEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.claimant === expected.claimant &&
        actual.rewardDebt.toBigInt() === expected.rewardDebt
    )
}

function deepEqualsSetRedemptionTimestampEvent(
    actual: ActualSetRedemptionTimestampEvent,
    expected: ExpectedSetRedemptionTimestampEvent
): boolean {
    return actual.timestamp.toBigInt() === expected.timestamp
}

function deepEqualsUpdateRewardTimeLockEvent(
    actual: ActualUpdateRewardTimeLockEvent,
    expected: ExpectedUpdateRewardTimeLockEvent
): boolean {
    return (
        actual.tokens === expected.tokens &&
        actual.timeLock.toBigInt() === expected.timeLock
    )
}
