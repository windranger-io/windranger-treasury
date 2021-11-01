import {BigNumber, ContractReceipt, Event} from 'ethers'
import {expect} from 'chai'
import {BondCreatedEvent} from '../../typechain/BondFactory'
import {
    AllowRedemptionEvent,
    DebtIssueEvent,
    RedemptionEvent,
    SlashEvent,
    WithdrawCollateralEvent
} from '../../typechain/Bond'
import {TransferEvent} from '../../typechain/IERC20'

/**
 * Expected balance combination of a symbol and amount (value).
 */
export type ExpectTokenBalance = {
    symbol: string
    amount: bigint
}

/**
 * Expected ERC20 transfer event, with sender, receiver and value.
 */
export type ExpectTokenTransfer = {
    from: string
    to: string
    amount: bigint
}

/**
 * Expected transfer event, with receiver, token symbol and value.
 */
export type ExpectFlushTransfer = {
    to: string
    symbol: string
    amount: bigint
}

/**
 * Shape check and conversion for a AllowRedemptionEvent.
 */
export function allowRedemptionEvent(event: Event): {authorizer: string} {
    const debt = event as AllowRedemptionEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.authorizer).is.not.undefined

    return debt.args
}

/**
 * Shape check and conversion for a BondCreatedEvent.
 */
export function bondCreatedEvent(event: Event): {
    bond: string
    name: string
    symbol: string
    owner: string
    treasury: string
} {
    const bondCreated = event as BondCreatedEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.bond).is.not.undefined
    expect(args?.name).is.not.undefined
    expect(args?.symbol).is.not.undefined
    expect(args?.owner).is.not.undefined
    expect(args?.treasury).is.not.undefined

    return bondCreated.args
}

/**
 * Shape check and conversion for a WithdrawCollateralEvent.
 */
export function withdrawCollateralEvent(event: Event): {
    receiver: string
    symbol: string
    amount: BigNumber
} {
    const close = event as WithdrawCollateralEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.receiver).is.not.undefined
    expect(args?.symbol).is.not.undefined
    expect(args?.amount).is.not.undefined

    return close.args
}

/**
 * Shape check and conversion for a DebtIssueEvent.
 */
export function debtIssueEvent(event: Event): {
    receiver: string
    debSymbol: string
    debtAmount: BigNumber
} {
    const debt = event as DebtIssueEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.receiver).is.not.undefined
    expect(args?.debSymbol).is.not.undefined
    expect(args?.debtAmount).is.not.undefined

    return debt.args
}

/**
 * Retrieves an event with matching name, otherwise fails the test.
 *
 * @param name exact expected within the events.
 * @param events events that is expected to contain an exact match for the given name.
 */
export function event(name: string, events: Event[]): Event {
    for (let i = 0; i < events.length; i++) {
        if (events[i]?.event === name) return events[i]
    }

    expect.fail('Failed to find event matching name: %s', name)
}

/**
 * Checked retrieval of the event array from a receipt.
 */
export function events(receipt: ContractReceipt): Event[] {
    expect(receipt.events).is.not.undefined
    const events = receipt.events
    expect(events).is.not.undefined
    return events ? events : []
}

/**
 * Shape check and conversion for a RedemptionEvent.
 */
export function redemptionEvent(event: Event): {
    redeemer: string
    debtSymbol: string
    debtAmount: BigNumber
    collateralSymbol: string
    collateralAmount: BigNumber
} {
    const debt = event as RedemptionEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.redeemer).is.not.undefined
    expect(args?.debtSymbol).is.not.undefined
    expect(args?.debtAmount).is.not.undefined
    expect(args?.collateralSymbol).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return debt.args
}

/**
 * Shape check and conversion for a SlashEvent.
 */
export function slashEvent(event: Event): {
    collateralSymbol: string
    collateralAmount: BigNumber
} {
    const debt = event as SlashEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.collateralSymbol).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return debt.args
}

/**
 * Shape check and conversion for a SlashEvent.
 */
export function transferEvent(event: Event): {
    from: string
    to: string
    value: BigNumber
} {
    const debt = event as TransferEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.from).is.not.undefined
    expect(args?.to).is.not.undefined
    expect(args?.value).is.not.undefined

    return debt.args
}

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
    expect(onlyTransferEvent.receiver, 'Transfer from').equals(transfer.to)
    expect(onlyTransferEvent.symbol, 'Transfer to').equals(transfer.symbol)
    expect(onlyTransferEvent.amount, 'Transfer amount').equals(transfer.amount)
}
