import {BigNumber, ContractReceipt} from 'ethers'
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
    transferEvents,
    withdrawCollateralEvent
} from './bond-events'

/**
 * Verifies the content for a Allow Redemption event.
 */
export function verifyAllowRedemptionEvent(
    receipt: ContractReceipt,
    authorizer: string
): void {
    const allowRedemption = allowRedemptionEvent(
        event('AllowRedemption', receipt)
    )
    expect(allowRedemption.authorizer, 'AllowRedemption authorizer').equals(
        authorizer
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
export function verifyDebtIssueEvent(
    receipt: ContractReceipt,
    guarantor: string,
    debt: ExpectTokenBalance
): void {
    const depositOneEvent = debtIssueEvent(event('DebtIssue', receipt))
    expect(depositOneEvent.receiver, 'Debt token receiver').equals(guarantor)
    expect(depositOneEvent.debSymbol, 'Debt token symbol').equals(debt.symbol)
    expect(depositOneEvent.debtAmount, 'Debt token amount').equals(debt.amount)
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
export function verifyPartialCollateralEvent(
    receipt: ContractReceipt,
    collateral: ExpectTokenBalance,
    debt: ExpectTokenBalance
): void {
    const partialCollateral = partialCollateralEvent(
        event('PartialCollateral', receipt)
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
export function verifyRedemptionEvent(
    receipt: ContractReceipt,
    redeemer: string,
    debt: ExpectTokenBalance,
    collateral: ExpectTokenBalance
): void {
    const redemptionTwoEvent = redemptionEvent(event('Redemption', receipt))
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
export function verifySlashEvent(
    receipt: ContractReceipt,
    collateral: ExpectTokenBalance
): void {
    const onlySlashEvent = slashEvent(event('Slash', receipt))
    expect(onlySlashEvent.collateralSymbol, 'Slash symbol').equals(
        collateral.symbol
    )
    expect(onlySlashEvent.collateralAmount, 'Slash amount').equals(
        collateral.amount
    )
}

/**
 * Verifies the content matches at least one of the Transfer events.
 */
export function verifyTransferEvents(
    receipt: ContractReceipt,
    transfers: ExpectTokenTransfer[]
): void {
    const actualTransfers = transferEvents(events('Transfer', receipt))
    let matches = 0
    let lastMatchIndex = -1

    /*
     * Matching entries are removed from actualTransfers before the next loop.
     * Avoids the same event being matched twice.
     */
    for (const expectedTransfer of transfers) {
        let matchIndex = -1
        for (let i = 0; i < actualTransfers.length; i++) {
            if (equalTokenTransfer(expectedTransfer, actualTransfers[i])) {
                matchIndex = i
            }
        }
        if (matchIndex >= 0) {
            // Size of array reduces on match, hence >= and not >
            expect(
                matchIndex,
                'TransferEvent in wrong order'
            ).is.greaterThanOrEqual(lastMatchIndex)

            matches++
            actualTransfers.splice(matchIndex, 1)
            lastMatchIndex = matchIndex
        }
    }

    expect(matches, 'Not all expected TransferEvent matches found').equals(
        transfers.length
    )
}

function equalTokenTransfer(
    expected: ExpectTokenTransfer,
    transfer: {
        from: string
        to: string
        value: BigNumber
    }
) {
    return (
        expected.from === transfer.from &&
        expected.to === transfer.to &&
        expected.amount == transfer.value.toBigInt()
    )
}

/**
 * Verifies the content for withdrawing the left over collateral (flush of remaining collateral assets) event.
 */
export function verifyWithdrawCollateralEvent(
    receipt: ContractReceipt,
    transfer: ExpectFlushTransfer
): void {
    const onlyTransferEvent = withdrawCollateralEvent(
        event('WithdrawCollateral', receipt)
    )
    expect(onlyTransferEvent.treasury, 'Transfer from').equals(transfer.to)
    expect(onlyTransferEvent.collateralSymbol, 'Transfer to').equals(
        transfer.symbol
    )
    expect(onlyTransferEvent.collateralAmount, 'Transfer amount').equals(
        transfer.amount
    )
}
