import {BaseContract, ContractReceipt} from 'ethers'
import {events} from '../../framework/events'
import {
    ActualAllowRedemptionEvent,
    ActualDebtIssueEvent,
    ActualDepositEvent,
    ActualExpireEvent,
    ActualFullCollateralEvent,
    allowRedemptionEventLogs,
    allowRedemptionEvents,
    debtIssueEventLogs,
    debtIssueEvents,
    depositEventLogs,
    depositEvents,
    expireEvents,
    expireEventLogs,
    fullCollateralEventLogs,
    fullCollateralEvents,
    ActualPartialCollateralEvent,
    partialCollateralEvents,
    partialCollateralEventLogs,
    ActualRedemptionEvent,
    redemptionEvents,
    redemptionEventLogs,
    slashDepositsEvents,
    ActualSlashEvent,
    slashDepositsEventLogs,
    withdrawCollateralEvents,
    ActualWithdrawCollateralEvent,
    withdrawCollateralEventLogs
} from './single-collateral-bond-events'
import {verifyOrderedEvents} from '../../framework/verify'
import {eventLog} from '../../framework/event-logs'

export type ExpectDebtIssueEvent = {
    amount: bigint
    tokens: string
    receiver: string
}

export type ExpectDepositEvent = {
    tokens: string
    amount: bigint
    depositor: string
}

export type ExpectExpireEvent = {
    tokens: string
    amount: bigint
    treasury: string
    instigator: string
}

export type ExpectRedemptionEvent = {
    redeemer: string
    debtTokens: string
    debtAmount: bigint
    collateralTokens: string
    collateralAmount: bigint
}

export type ExpectSlashEvent = {
    reason: string
    collateralTokens: string
    collateralAmount: bigint
    instigator: string
}

export type ExpectWithdrawCollateralEvent = {
    treasury: string
    collateralTokens: string
    collateralAmount: bigint
    instigator: string
}

export type ExpectFullCollateralEvent = {
    collateralTokens: string
    collateralAmount: bigint
    instigator: string
}

export type ExpectPartialCollateralEvent = {
    collateralTokens: string
    collateralAmount: bigint
    debtTokens: string
    debtRemaining: bigint
    instigator: string
}

export type ExpectAllowRedemptionEvent = {
    authorizer: string
    reason: string
}
/**
 * Verifies the content for AllowRedemption events.
 */
export function verifyAllowRedemptionEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectAllowRedemptionEvent[]
): void {
    const actualEvents = allowRedemptionEvents(
        events('AllowRedemption', receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectAllowRedemptionEvent,
            actual: ActualAllowRedemptionEvent
        ) => deepEqualsAllowRedemptionEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected AllowRedemption events.
 */
export function verifyAllowRedemptionLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectAllowRedemptionEvent[]
): void {
    const actualEvents = allowRedemptionEventLogs(
        eventLog('AllowRedemption', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectAllowRedemptionEvent,
            actual: ActualAllowRedemptionEvent
        ) => deepEqualsAllowRedemptionEvent(expected, actual)
    )
}

/**
 * Verifies the content for a Full Collateral event.
 */
export function verifyFullCollateralEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectFullCollateralEvent[]
): void {
    const actualEvents = fullCollateralEvents(events('FullCollateral', receipt))

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectFullCollateralEvent,
            actual: ActualFullCollateralEvent
        ) => deepEqualsFullCollateralEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected FullCollateral events.
 */
export function verifyFullCollateralEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectFullCollateralEvent[]
): void {
    const actualEvents = fullCollateralEventLogs(
        eventLog('FullCollateral', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectFullCollateralEvent,
            actual: ActualFullCollateralEvent
        ) => deepEqualsFullCollateralEvent(expected, actual)
    )
}

/**
 * Verifies the content for a DebtIssue events.
 */
export function verifyDebtIssueEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectDebtIssueEvent[]
): void {
    const actualEvents = debtIssueEvents(events('DebtIssue', receipt))

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectDebtIssueEvent, actual: ActualDebtIssueEvent) =>
            deepEqualsDebtIssueEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected DebtIssue events.
 */
export function verifyDebtIssueEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectDebtIssueEvent[]
): void {
    const actualEvents = debtIssueEventLogs(
        eventLog('DebtIssue', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectDebtIssueEvent, actual: ActualDebtIssueEvent) =>
            deepEqualsDebtIssueEvent(expected, actual)
    )
}

/**
 * Verifies the content for a Deposit events.
 */
export function verifyDepositEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectDepositEvent[]
): void {
    const actualEvents = depositEvents(events('Deposit', receipt))

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectDepositEvent, actual: ActualDepositEvent) =>
            deepEqualsDepositEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected Deposit events.
 */
export function verifyDepositEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectDepositEvent[]
): void {
    const actualEvents = depositEventLogs(eventLog('Deposit', emitter, receipt))

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectDepositEvent, actual: ActualDepositEvent) =>
            deepEqualsDepositEvent(expected, actual)
    )
}

/**
 * Verifies the content for Expire events.
 */
export function verifyExpireEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectExpireEvent[]
): void {
    const actualEvents = expireEvents(events('Expire', receipt))

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectExpireEvent, actual: ActualExpireEvent) =>
            deepEqualsExpireEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected Expire events.
 */
export function verifyExpireEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectExpireEvent[]
): void {
    const actualEvents = expireEventLogs(eventLog('Expire', emitter, receipt))

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectExpireEvent, actual: ActualExpireEvent) =>
            deepEqualsExpireEvent(expected, actual)
    )
}

/**
 * Verifies the content for PartialCollateral events.
 */
export function verifyPartialCollateralEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectPartialCollateralEvent[]
): void {
    const actualEvents = partialCollateralEvents(
        events('PartialCollateral', receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectPartialCollateralEvent,
            actual: ActualPartialCollateralEvent
        ) => deepEqualsPartialCollateralEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected PartialCollateral events.
 */
export function verifyPartialCollateralEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectPartialCollateralEvent[]
): void {
    const actualEvents = partialCollateralEventLogs(
        eventLog('PartialCollateral', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectPartialCollateralEvent,
            actual: ActualPartialCollateralEvent
        ) => deepEqualsPartialCollateralEvent(expected, actual)
    )
}

/**
 * Verifies the content for Redemption events.
 */
export function verifyRedemptionEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectRedemptionEvent[]
): void {
    const actualEvents = redemptionEvents(events('Redemption', receipt))

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectRedemptionEvent, actual: ActualRedemptionEvent) =>
            deepEqualsRedemptionEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected Redemption events.
 */
export function verifyRedemptionEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectRedemptionEvent[]
): void {
    const actualEvents = redemptionEventLogs(
        eventLog('Redemption', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectRedemptionEvent, actual: ActualRedemptionEvent) =>
            deepEqualsRedemptionEvent(expected, actual)
    )
}

/**
 * Verifies the content for a Slash event.
 */
export function verifySlashDepositEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectSlashEvent[]
): void {
    const actualEvents = slashDepositsEvents(events('SlashDeposits', receipt))

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectSlashEvent, actual: ActualSlashEvent) =>
            deepEqualsSlashDepositEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected Slash events.
 */
export function verifySlashDepositEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectSlashEvent[]
): void {
    const actualEvents = slashDepositsEventLogs(
        eventLog('SlashDeposits', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (expected: ExpectSlashEvent, actual: ActualSlashEvent) =>
            deepEqualsSlashDepositEvent(expected, actual)
    )
}

/**
 * Verifies the content for withdrawing any leftover collateral (flush of remaining collateral assets) event.
 */
export function verifyWithdrawCollateralEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectWithdrawCollateralEvent[]
): void {
    const actualEvents = withdrawCollateralEvents(
        events('WithdrawCollateral', receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectWithdrawCollateralEvent,
            actual: ActualWithdrawCollateralEvent
        ) => deepEqualsWithdrawCollateralEvent(expected, actual)
    )
}

/**
 * Verifies the event log entries contain the expected WithdrawCollateral events.
 */
export function verifyWithdrawCollateralEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectWithdrawCollateralEvent[]
): void {
    const actualEvents = withdrawCollateralEventLogs(
        eventLog('WithdrawCollateral', emitter, receipt)
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        (
            expected: ExpectWithdrawCollateralEvent,
            actual: ActualWithdrawCollateralEvent
        ) => deepEqualsWithdrawCollateralEvent(expected, actual)
    )
}

function deepEqualsAllowRedemptionEvent(
    expected: ExpectAllowRedemptionEvent,
    actual: ActualAllowRedemptionEvent
): boolean {
    return (
        actual.authorizer === expected.authorizer &&
        actual.reason === expected.reason
    )
}

function deepEqualsFullCollateralEvent(
    expected: ExpectFullCollateralEvent,
    actual: ActualFullCollateralEvent
): boolean {
    return (
        actual.collateralTokens === expected.collateralTokens &&
        actual.collateralAmount.toBigInt() === expected.collateralAmount &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsDebtIssueEvent(
    expected: ExpectDebtIssueEvent,
    actual: ActualDebtIssueEvent
): boolean {
    return (
        actual.receiver === expected.receiver &&
        actual.debTokens === expected.tokens &&
        actual.debtAmount.toBigInt() === expected.amount
    )
}

function deepEqualsDepositEvent(
    expected: ExpectDepositEvent,
    actual: ActualDepositEvent
): boolean {
    return (
        actual.depositor === expected.depositor &&
        actual.collateralTokens === expected.tokens &&
        actual.collateralAmount.toBigInt() === expected.amount
    )
}

function deepEqualsExpireEvent(
    expected: ExpectExpireEvent,
    actual: ActualExpireEvent
): boolean {
    return (
        actual.treasury === expected.treasury &&
        actual.collateralTokens === expected.tokens &&
        actual.collateralAmount.toBigInt() === expected.amount &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsPartialCollateralEvent(
    expected: ExpectPartialCollateralEvent,
    actual: ActualPartialCollateralEvent
): boolean {
    return (
        actual.collateralTokens === expected.collateralTokens &&
        actual.collateralAmount.toBigInt() === expected.collateralAmount &&
        actual.debtTokens === expected.debtTokens &&
        actual.debtRemaining.toBigInt() === expected.debtRemaining &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsRedemptionEvent(
    expected: ExpectRedemptionEvent,
    actual: ActualRedemptionEvent
): boolean {
    return (
        actual.collateralTokens === expected.collateralTokens &&
        actual.collateralAmount.toBigInt() === expected.collateralAmount &&
        actual.debtTokens === expected.debtTokens &&
        actual.debtAmount.toBigInt() === expected.debtAmount &&
        actual.redeemer === expected.redeemer
    )
}

function deepEqualsSlashDepositEvent(
    expected: ExpectSlashEvent,
    actual: ActualSlashEvent
): boolean {
    return (
        actual.collateralTokens === expected.collateralTokens &&
        actual.collateralAmount.toBigInt() === expected.collateralAmount &&
        actual.reason === expected.reason &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsWithdrawCollateralEvent(
    expected: ExpectWithdrawCollateralEvent,
    actual: ActualWithdrawCollateralEvent
): boolean {
    return (
        actual.treasury === expected.treasury &&
        actual.collateralTokens === expected.collateralTokens &&
        actual.collateralAmount.toBigInt() === expected.collateralAmount &&
        actual.instigator === expected.instigator
    )
}
