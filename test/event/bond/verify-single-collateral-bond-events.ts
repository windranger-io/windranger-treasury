import {ContractReceipt} from 'ethers'
import {event} from '../../framework/events'
import {expect} from 'chai'
import {
    allowRedemptionEvent,
    debtIssueEvent,
    depositEvent,
    expireEvent,
    fullCollateralEvent,
    partialCollateralEvent,
    redemptionEvent,
    slashDepositsEvent,
    withdrawCollateralEvent
} from './single-collateral-bond-events'

/**
 * Expected balance combination of a symbol and amount (value).
 */
export type ExpectTokenBalance = {
    tokens: string
    amount: bigint
}

export type ExpectSlashEvent = {
    reason: string
    tokens: string
    amount: bigint
}

export type ExpectFlushTransferEvent = {
    to: string
    tokens: string
    amount: bigint
}

export type ExpectAllowRedemptionEvent = {
    authorizer: string
    reason: string
}
/**
 * Verifies the content for a Allow Redemption event.
 */
export function verifyAllowRedemptionEvent(
    receipt: ContractReceipt,
    expected: ExpectAllowRedemptionEvent
): void {
    const allowRedemption = allowRedemptionEvent(
        event('AllowRedemption', receipt)
    )
    expect(allowRedemption.authorizer, 'AllowRedemption authorizer').equals(
        expected.authorizer
    )
    expect(allowRedemption.reason).to.equal(expected.reason)
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
}

/**
 * Verifies the content for a Debt Issue event.
 */
export function verifyDebtIssueEvent(
    receipt: ContractReceipt,
    guarantor: string,
    debt: ExpectTokenBalance
): void {
    const depositOneEvent = debtIssueEvent(event('DebtIssue', receipt))
    expect(depositOneEvent.receiver, 'Debt token receiver').equals(guarantor)
    expect(depositOneEvent.debTokens, 'Debt token address').equals(debt.tokens)
    expect(depositOneEvent.debtAmount, 'Debt token amount').equals(debt.amount)
}

/**
 * Verifies the content for a Deposit event.
 */
export function verifyDepositEvent(
    receipt: ContractReceipt,
    guarantor: string,
    collateral: ExpectTokenBalance
): void {
    const depositOneEvent = depositEvent(event('Deposit', receipt))
    expect(depositOneEvent.depositor, 'depositor').equals(guarantor)
    expect(depositOneEvent.collateralTokens, 'Collateral token address').equals(
        collateral.tokens
    )
    expect(depositOneEvent.collateralAmount, 'Collateral amount').equals(
        collateral.amount
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
    const depositOneEvent = expireEvent(event('Expire', receipt))
    expect(depositOneEvent.sender, 'Debt token receiver').equals(sender)
    expect(depositOneEvent.treasury, 'Debt token receiver').equals(treasury)
    expect(depositOneEvent.collateralTokens, 'Debt token address').equals(
        collateral.tokens
    )
    expect(depositOneEvent.collateralAmount, 'Debt token amount').equals(
        collateral.amount
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
    const redemptionTwoEvent = redemptionEvent(event('Redemption', receipt))
    expect(redemptionTwoEvent.redeemer, 'Redemption redeemer').equals(redeemer)
    expect(redemptionTwoEvent.debtTokens, 'Redemption debt address').equals(
        debt.tokens
    )
    expect(redemptionTwoEvent.debtAmount, 'Redemption debt amount').equals(
        debt.amount
    )
    expect(
        redemptionTwoEvent.collateralTokens,
        'Redemption collateral address'
    ).equals(collateral.tokens)
    expect(
        redemptionTwoEvent.collateralAmount,
        'Redemption collateral amount'
    ).equals(collateral.amount)
}

/**
 * Verifies the content for a Slash event.
 */
export function verifySlashDepositsEvent(
    receipt: ContractReceipt,
    expectedSlashEvent: ExpectSlashEvent
): void {
    const onlySlashEvent = slashDepositsEvent(event('SlashDeposits', receipt))
    expect(onlySlashEvent.collateralTokens, 'Collateral tokens address').equals(
        expectedSlashEvent.tokens
    )
    expect(onlySlashEvent.collateralAmount, 'Slash amount').equals(
        expectedSlashEvent.amount
    )
    expect(onlySlashEvent.reason, 'Slash reason').equals(
        expectedSlashEvent.reason
    )
}

/**
 * Verifies the content for withdrawing the left over collateral (flush of remaining collateral assets) event.
 */
export function verifyWithdrawCollateralEvent(
    receipt: ContractReceipt,
    transfer: ExpectFlushTransferEvent
): void {
    const onlyTransferEvent = withdrawCollateralEvent(
        event('WithdrawCollateral', receipt)
    )
    expect(onlyTransferEvent.treasury, 'Transfer from').equals(transfer.to)
    expect(
        onlyTransferEvent.collateralTokens,
        'Collateral tokens address'
    ).equals(transfer.tokens)
    expect(onlyTransferEvent.collateralAmount, 'Transfer amount').equals(
        transfer.amount
    )
}
