import {BaseContract, ContractReceipt} from 'ethers'
import {event, events} from '../../framework/events'
import {expect} from 'chai'
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
    slashDepositsEvent,
    withdrawCollateralEvent,
    ActualPartialCollateralEvent,
    partialCollateralEvents,
    partialCollateralEventLogs,
    ActualRedemptionEvent,
    redemptionEvents,
    redemptionEventLogs
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
    tokens: string
    amount: bigint
    instigator: string
}

export type ExpectFlushTransferEvent = {
    to: string
    tokens: string
    amount: bigint
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
        actualEvents,
        expectedEvents,
        (
            actual: ActualAllowRedemptionEvent,
            expected: ExpectAllowRedemptionEvent
        ) => deepEqualsAllowRedemptionEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (
            actual: ActualAllowRedemptionEvent,
            expected: ExpectAllowRedemptionEvent
        ) => deepEqualsAllowRedemptionEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (
            actual: ActualFullCollateralEvent,
            expected: ExpectFullCollateralEvent
        ) => deepEqualsFullCollateralEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (
            actual: ActualFullCollateralEvent,
            expected: ExpectFullCollateralEvent
        ) => deepEqualsFullCollateralEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (actual: ActualDebtIssueEvent, expected: ExpectDebtIssueEvent) =>
            deepEqualsDebtIssueEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (actual: ActualDebtIssueEvent, expected: ExpectDebtIssueEvent) =>
            deepEqualsDebtIssueEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (actual: ActualDepositEvent, expected: ExpectDepositEvent) =>
            deepEqualsDepositEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (actual: ActualDepositEvent, expected: ExpectDepositEvent) =>
            deepEqualsDepositEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (actual: ActualExpireEvent, expected: ExpectExpireEvent) =>
            deepEqualsExpireEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (actual: ActualExpireEvent, expected: ExpectExpireEvent) =>
            deepEqualsExpireEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (
            actual: ActualPartialCollateralEvent,
            expected: ExpectPartialCollateralEvent
        ) => deepEqualsPartialCollateralEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (
            actual: ActualPartialCollateralEvent,
            expected: ExpectPartialCollateralEvent
        ) => deepEqualsPartialCollateralEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (actual: ActualRedemptionEvent, expected: ExpectRedemptionEvent) =>
            deepEqualsRedemptionEvent(actual, expected)
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
        actualEvents,
        expectedEvents,
        (actual: ActualRedemptionEvent, expected: ExpectRedemptionEvent) =>
            deepEqualsRedemptionEvent(actual, expected)
    )
}

/**
 * Verifies the content for a Slash event.
 */
export function verifySlashDepositsEvent(
    receipt: ContractReceipt,
    expectedSlashEvent: ExpectSlashEvent
): void {
    const slashDeposit = slashDepositsEvent(event('SlashDeposits', receipt))
    expect(slashDeposit.collateralTokens, 'Collateral tokens address').equals(
        expectedSlashEvent.tokens
    )
    expect(slashDeposit.collateralAmount, 'Slash amount').equals(
        expectedSlashEvent.amount
    )
    expect(slashDeposit.reason, 'Slash reason').equals(
        expectedSlashEvent.reason
    )
    expect(slashDeposit.instigator, 'Instigator address').equals(
        expectedSlashEvent.instigator
    )
}

/**
 * Verifies the content for withdrawing the left over collateral (flush of remaining collateral assets) event.
 */
export function verifyWithdrawCollateralEvent(
    receipt: ContractReceipt,
    transfer: ExpectFlushTransferEvent
): void {
    const withdrawCollateral = withdrawCollateralEvent(
        event('WithdrawCollateral', receipt)
    )
    expect(withdrawCollateral.treasury, 'Transfer from').equals(transfer.to)
    expect(
        withdrawCollateral.collateralTokens,
        'Collateral tokens address'
    ).equals(transfer.tokens)
    expect(withdrawCollateral.collateralAmount, 'Transfer amount').equals(
        transfer.amount
    )
    expect(withdrawCollateral.instigator, 'Instigator address').equals(
        transfer.instigator
    )
}

function deepEqualsAllowRedemptionEvent(
    actual: ActualAllowRedemptionEvent,
    expected: ExpectAllowRedemptionEvent
): boolean {
    return (
        actual.authorizer === expected.authorizer &&
        actual.reason === expected.reason
    )
}

function deepEqualsFullCollateralEvent(
    actual: ActualFullCollateralEvent,
    expected: ExpectFullCollateralEvent
): boolean {
    return (
        actual.collateralTokens === expected.collateralTokens &&
        actual.collateralAmount.toBigInt() === expected.collateralAmount &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsDebtIssueEvent(
    actual: ActualDebtIssueEvent,
    expected: ExpectDebtIssueEvent
): boolean {
    return (
        actual.receiver === expected.receiver &&
        actual.debTokens === expected.tokens &&
        actual.debtAmount.toBigInt() === expected.amount
    )
}

function deepEqualsDepositEvent(
    actual: ActualDepositEvent,
    expected: ExpectDepositEvent
): boolean {
    return (
        actual.depositor === expected.depositor &&
        actual.collateralTokens === expected.tokens &&
        actual.collateralAmount.toBigInt() === expected.amount
    )
}

function deepEqualsExpireEvent(
    actual: ActualExpireEvent,
    expected: ExpectExpireEvent
): boolean {
    return (
        actual.treasury === expected.treasury &&
        actual.collateralTokens === expected.tokens &&
        actual.collateralAmount.toBigInt() === expected.amount &&
        actual.instigator === expected.instigator
    )
}

function deepEqualsPartialCollateralEvent(
    actual: ActualPartialCollateralEvent,
    expected: ExpectPartialCollateralEvent
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
    actual: ActualRedemptionEvent,
    expected: ExpectRedemptionEvent
): boolean {
    return (
        actual.collateralTokens === expected.collateralTokens &&
        actual.collateralAmount.toBigInt() === expected.collateralAmount &&
        actual.debtTokens === expected.debtTokens &&
        actual.debtAmount.toBigInt() === expected.debtAmount &&
        actual.redeemer === expected.redeemer
    )
}
