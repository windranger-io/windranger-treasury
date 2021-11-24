import {ContractReceipt} from 'ethers'
import {event, events} from '../../framework/events'
import {expect} from 'chai'
import {
    allowRedemptionEvent,
    debtIssueEvent,
    ExpectFlushTransfer,
    ExpectTokenBalance,
    ExpectTokenTransfer,
    expireEvent,
    fullCollateralEvent,
    partialCollateralEvent,
    redemptionEvent,
    slashEvent,
    transferEvent,
    withdrawCollateralEvent
} from './bond-events'

/**
 * Verifies the content for a Allow Redemption event.
 */
export async function verifyAllowRedemptionEvent(
    receipt: ContractReceipt,
    authorizer: string
): Promise<void> {
    const allowRedemption = allowRedemptionEvent(
        event('AllowRedemption', events(receipt))
    )
    expect(allowRedemption.authorizer, 'AllowRedemption authorizer').equals(
        authorizer
    )
}

/**
 * Verifies the content for a Full Collateral event.
 */
export async function verifyFullCollateralEvent(
    receipt: ContractReceipt,
    collateral: ExpectTokenBalance
): Promise<void> {
    const fullCollateral = fullCollateralEvent(
        event('FullCollateral', events(receipt))
    )
    expect(fullCollateral.collateralSymbol, 'Debt token symbol').equals(
        collateral.symbol
    )
    expect(fullCollateral.collateralAmount, 'Debt token amount').equals(
        collateral.amount
    )
}

/**
 * Verifies the content for a Debt Issue event.
 */
export async function verifyDebtIssueEvent(
    receipt: ContractReceipt,
    guarantor: string,
    debt: ExpectTokenBalance
): Promise<void> {
    const depositOneEvent = debtIssueEvent(event('DebtIssue', events(receipt)))
    expect(depositOneEvent.receiver, 'Debt token receiver').equals(guarantor)
    expect(depositOneEvent.debSymbol, 'Debt token symbol').equals(debt.symbol)
    expect(depositOneEvent.debtAmount, 'Debt token amount').equals(debt.amount)
}

/**
 * Verifies the content for a Expire event.
 */
export async function verifyExpireEvent(
    receipt: ContractReceipt,
    sender: string,
    treasury: string,
    collateral: ExpectTokenBalance
): Promise<void> {
    const depositOneEvent = expireEvent(event('Expire', events(receipt)))
    expect(depositOneEvent.sender, 'Debt token receiver').equals(sender)
    expect(depositOneEvent.treasury, 'Debt token receiver').equals(treasury)
    expect(depositOneEvent.collateralSymbol, 'Debt token symbol').equals(
        collateral.symbol
    )
    expect(depositOneEvent.collateralAmount, 'Debt token amount').equals(
        collateral.amount
    )
}

/**
 * Verifies the content for a Full Collateral event.
 */
export async function verifyPartialCollateralEvent(
    receipt: ContractReceipt,
    collateral: ExpectTokenBalance,
    debt: ExpectTokenBalance
): Promise<void> {
    const partialCollateral = partialCollateralEvent(
        event('PartialCollateral', events(receipt))
    )
    expect(
        partialCollateral.collateralSymbol,
        'Collateral token symbol'
    ).equals(collateral.symbol)
    expect(
        partialCollateral.collateralAmount,
        'Collateral token amount'
    ).equals(collateral.amount)
    expect(partialCollateral.debtSymbol, 'Debt token symbol').equals(
        debt.symbol
    )
    expect(partialCollateral.debtRemaining, 'Debt tokens remaining').equals(
        debt.amount
    )
}

/**
 * Verifies the content for a Redemption event.
 */
export async function verifyRedemptionEvent(
    receipt: ContractReceipt,
    redeemer: string,
    debt: ExpectTokenBalance,
    collateral: ExpectTokenBalance
): Promise<void> {
    const redemptionTwoEvent = redemptionEvent(
        event('Redemption', events(receipt))
    )
    expect(redemptionTwoEvent.redeemer, 'Redemption redeemer').equals(redeemer)
    expect(redemptionTwoEvent.debtSymbol, 'Redemption debt symbol').equals(
        debt.symbol
    )
    expect(redemptionTwoEvent.debtAmount, 'Redemption debt amount').equals(
        debt.amount
    )
    expect(
        redemptionTwoEvent.collateralSymbol,
        'Redemption collateral symbol'
    ).equals(collateral.symbol)
    expect(
        redemptionTwoEvent.collateralAmount,
        'Redemption collateral amount'
    ).equals(collateral.amount)
}

/**
 * Verifies the content for a Slash event.
 */
export async function verifySlashEvent(
    receipt: ContractReceipt,
    collateral: ExpectTokenBalance
): Promise<void> {
    const onlySlashEvent = slashEvent(event('Slash', events(receipt)))
    expect(onlySlashEvent.collateralSymbol, 'Slash symbol').equals(
        collateral.symbol
    )
    expect(onlySlashEvent.collateralAmount, 'Slash amount').equals(
        collateral.amount
    )
}

/**
 * Verifies the content for a ERC20 Transfer event.
 */
export async function verifyTransferEvent(
    receipt: ContractReceipt,
    transfer: ExpectTokenTransfer
): Promise<void> {
    const onlyTransferEvent = transferEvent(event('Transfer', events(receipt)))
    expect(onlyTransferEvent.from, 'Transfer from').equals(transfer.from)
    expect(onlyTransferEvent.to, 'Transfer to').equals(transfer.to)
    expect(onlyTransferEvent.value, 'Transfer amount').equals(transfer.amount)
}

/**
 * Verifies the content for withdrawing the left over collateral (flush of remaining collateral assets) event.
 */
export async function verifyWithdrawCollateralEvent(
    receipt: ContractReceipt,
    transfer: ExpectFlushTransfer
): Promise<void> {
    const onlyTransferEvent = withdrawCollateralEvent(
        event('WithdrawCollateral', events(receipt))
    )
    expect(onlyTransferEvent.treasury, 'Transfer from').equals(transfer.to)
    expect(onlyTransferEvent.collateralSymbol, 'Transfer to').equals(
        transfer.symbol
    )
    expect(onlyTransferEvent.collateralAmount, 'Transfer amount').equals(
        transfer.amount
    )
}
