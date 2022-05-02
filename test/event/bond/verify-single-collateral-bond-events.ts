import {BaseContract, ContractReceipt} from 'ethers'
import {event, events} from '../../framework/events'
import {expect} from 'chai'
import {
    ActualAllowRedemptionEvent,
    allowRedemptionEventLogs,
    allowRedemptionEvents,
    debtIssueEvent,
    depositEvent,
    expireEvent,
    fullCollateralEvent,
    partialCollateralEvent,
    redemptionEvent,
    slashDepositsEvent,
    withdrawCollateralEvent
} from './single-collateral-bond-events'
import {verifyOrderedEvents} from '../../framework/verify'
import {eventLog} from '../../framework/event-logs'

/**
 * Expected balance combination of a symbol and amount (value).
 */
export type ExpectTokenBalance = {
    tokens: string
    amount: bigint
    instigator: string
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

export type ExpectAllowRedemptionEvent = {
    authorizer: string
    reason: string
}
/**
 * Verifies the content for AllowRedemption events.
 */
export function verifyAllowRedemptionEvent(
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
export function verifyFullCollateralEvent(
    receipt: ContractReceipt,
    collateral: ExpectTokenBalance
): void {
    const fullCollateral = fullCollateralEvent(event('FullCollateral', receipt))
    expect(fullCollateral.collateralTokens, 'Debt token address').equals(
        collateral.tokens
    )
    expect(fullCollateral.collateralAmount, 'Debt token amount').equals(
        collateral.amount
    )
    expect(fullCollateral.instigator, 'Instigator address').equals(
        collateral.instigator
    )
}

/**
 * Verifies the content for a Debt Issue event.
 */
export function verifyDebtIssueEvent(
    receipt: ContractReceipt,
    guarantor: string,
    debt: ExpectTokenBalance
): void {
    const debtIssue = debtIssueEvent(event('DebtIssue', receipt))
    expect(debtIssue.receiver, 'Debt token receiver').equals(guarantor)
    expect(debtIssue.debTokens, 'Debt token address').equals(debt.tokens)
    expect(debtIssue.debtAmount, 'Debt token amount').equals(debt.amount)
    expect(debtIssue.instigator, 'Instigator address').equals(debt.instigator)
}

/**
 * Verifies the content for a Deposit event.
 */
export function verifyDepositEvent(
    receipt: ContractReceipt,
    guarantor: string,
    collateral: ExpectTokenBalance
): void {
    const deposit = depositEvent(event('Deposit', receipt))
    expect(deposit.depositor, 'depositor').equals(guarantor)
    expect(deposit.collateralTokens, 'Collateral token address').equals(
        collateral.tokens
    )
    expect(deposit.collateralAmount, 'Collateral amount').equals(
        collateral.amount
    )
    expect(deposit.instigator, 'Instigator address').equals(
        collateral.instigator
    )
}

/**
 * Verifies the content for a Expire event.
 */
export function verifyExpireEvent(
    receipt: ContractReceipt,
    sender: string,
    treasury: string,
    collateral: ExpectTokenBalance
): void {
    const expire = expireEvent(event('Expire', receipt))
    expect(expire.treasury, 'Debt token receiver').equals(treasury)
    expect(expire.collateralTokens, 'Debt token address').equals(
        collateral.tokens
    )
    expect(expire.collateralAmount, 'Debt token amount').equals(
        collateral.amount
    )
    expect(expire.instigator, 'Instigator address').equals(
        collateral.instigator
    )
}

/**
 * Verifies the content for a Full Collateral event.
 */
export function verifyPartialCollateralEvent(
    receipt: ContractReceipt,
    collateral: ExpectTokenBalance,
    debt: ExpectTokenBalance
): void {
    const partialCollateral = partialCollateralEvent(
        event('PartialCollateral', receipt)
    )
    expect(
        partialCollateral.collateralTokens,
        'Collateral token address'
    ).equals(collateral.tokens)
    expect(
        partialCollateral.collateralAmount,
        'Collateral token amount'
    ).equals(collateral.amount)
    expect(partialCollateral.debtTokens, 'Debt token address').equals(
        debt.tokens
    )
    expect(partialCollateral.debtRemaining, 'Debt tokens remaining').equals(
        debt.amount
    )
    expect(partialCollateral.instigator, 'Instigator address').equals(
        debt.instigator
    )
}

/**
 * Verifies the content for a Redemption event.
 */
export function verifyRedemptionEvent(
    receipt: ContractReceipt,
    redeemer: string,
    debt: ExpectTokenBalance,
    collateral: ExpectTokenBalance
): void {
    const redemption = redemptionEvent(event('Redemption', receipt))
    expect(redemption.redeemer, 'Redemption redeemer').equals(redeemer)
    expect(redemption.debtTokens, 'Redemption debt address').equals(debt.tokens)
    expect(redemption.debtAmount, 'Redemption debt amount').equals(debt.amount)
    expect(redemption.collateralTokens, 'Redemption collateral address').equals(
        collateral.tokens
    )
    expect(redemption.collateralAmount, 'Redemption collateral amount').equals(
        collateral.amount
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
