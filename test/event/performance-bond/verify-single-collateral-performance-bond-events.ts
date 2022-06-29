import {BaseContract, ContractReceipt} from 'ethers'
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
} from './single-collateral-performance-bond-events'
import {verifyOrderedEvents} from '../../framework/verify'
import {parseEventLog, parseEvents} from '../../framework/events'

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
    const actualEvents = parseEvents(
        receipt,
        'AllowRedemption',
        allowRedemptionEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsAllowRedemptionEvent
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
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'AllowRedemption',
        allowRedemptionEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsAllowRedemptionEvent
    )
}

/**
 * Verifies the content for a Full Collateral event.
 */
export function verifyFullCollateralEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectFullCollateralEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'FullCollateral',
        fullCollateralEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsFullCollateralEvent
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
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'FullCollateral',
        fullCollateralEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsFullCollateralEvent
    )
}

/**
 * Verifies the content for a DebtIssue events.
 */
export function verifyDebtIssueEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectDebtIssueEvent[]
): void {
    const actualEvents = parseEvents(receipt, 'DebtIssue', debtIssueEvents)

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsDebtIssueEvent)
}

/**
 * Verifies the event log entries contain the expected DebtIssue events.
 */
export function verifyDebtIssueEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectDebtIssueEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'DebtIssue',
        debtIssueEventLogs
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsDebtIssueEvent)
}

/**
 * Verifies the content for a Deposit events.
 */
export function verifyDepositEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectDepositEvent[]
): void {
    const actualEvents = parseEvents(receipt, 'Deposit', depositEvents)

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsDepositEvent)
}

/**
 * Verifies the event log entries contain the expected Deposit events.
 */
export function verifyDepositEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectDepositEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'Deposit',
        depositEventLogs
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsDepositEvent)
}

/**
 * Verifies the content for Expire events.
 */
export function verifyExpireEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectExpireEvent[]
): void {
    const actualEvents = parseEvents(receipt, 'Expire', expireEvents)

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsExpireEvent)
}

/**
 * Verifies the event log entries contain the expected Expire events.
 */
export function verifyExpireEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectExpireEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'Expire',
        expireEventLogs
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsExpireEvent)
}

/**
 * Verifies the content for PartialCollateral events.
 */
export function verifyPartialCollateralEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectPartialCollateralEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'PartialCollateral',
        partialCollateralEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsPartialCollateralEvent
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
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'PartialCollateral',
        partialCollateralEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsPartialCollateralEvent
    )
}

/**
 * Verifies the content for Redemption events.
 */
export function verifyRedemptionEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectRedemptionEvent[]
): void {
    const actualEvents = parseEvents(receipt, 'Redemption', redemptionEvents)

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsRedemptionEvent)
}

/**
 * Verifies the event log entries contain the expected Redemption events.
 */
export function verifyRedemptionEventLogs<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    expectedEvents: ExpectRedemptionEvent[]
): void {
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'Redemption',
        redemptionEventLogs
    )

    verifyOrderedEvents(expectedEvents, actualEvents, deepEqualsRedemptionEvent)
}

/**
 * Verifies the content for a Slash event.
 */
export function verifySlashDepositEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectSlashEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'SlashDeposits',
        slashDepositsEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsSlashDepositEvent
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
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'SlashDeposits',
        slashDepositsEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsSlashDepositEvent
    )
}

/**
 * Verifies the content for withdrawing any leftover collateral (flush of remaining collateral assets) event.
 */
export function verifyWithdrawCollateralEvents(
    receipt: ContractReceipt,
    expectedEvents: ExpectWithdrawCollateralEvent[]
): void {
    const actualEvents = parseEvents(
        receipt,
        'WithdrawCollateral',
        withdrawCollateralEvents
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsWithdrawCollateralEvent
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
    const actualEvents = parseEventLog(
        emitter,
        receipt,
        'WithdrawCollateral',
        withdrawCollateralEventLogs
    )

    verifyOrderedEvents(
        expectedEvents,
        actualEvents,
        deepEqualsWithdrawCollateralEvent
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
