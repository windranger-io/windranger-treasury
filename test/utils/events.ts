import {BigNumber, ContractReceipt, Event} from 'ethers'
import {expect} from 'chai'
import {CreateBondEvent} from '../../typechain/BondFactory'
import {
    AllowRedemptionEvent,
    DebtIssueEvent,
    ExpireEvent,
    FullCollateralEvent,
    PartialCollateralEvent,
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
 * Expected ERC20 token transfer event.
 */
export type ExpectTokenTransfer = {
    from: string
    to: string
    amount: bigint
}

/**
 * Expected transfer event, withdrawing the remaining token amount from a Bond.
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
 * Shape check and conversion for a CreateBondEvent.
 */
export function createBondEvent(event: Event): {
    bond: string
    name: string
    debtSymbol: string
    debtAmount: BigNumber
    owner: string
    treasury: string
    expiryTimestamp: BigNumber
    data: string
} {
    const create = event as CreateBondEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.bond).is.not.undefined
    expect(args?.name).is.not.undefined
    expect(args?.debtSymbol).is.not.undefined
    expect(args?.debtAmount).is.not.undefined
    expect(args?.owner).is.not.undefined
    expect(args?.treasury).is.not.undefined
    expect(args?.expiryTimestamp).is.not.undefined
    expect(args?.data).is.not.undefined

    return create.args
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
 * Retrieves an event that matches the given name, otherwise fails the test.
 *
 * @param name  name of the event expected within the given events.
 * @param events events expected to contain an exact match for the given name.
 */
export function event(name: string, events: Event[]): Event {
    for (let i = 0; i < events.length; i++) {
        if (events[i]?.event === name) return events[i]
    }

    expect.fail('Failed to find event matching name: ' + name)
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
 * Shape check and conversion for a ExpireEvent.
 */
export function expireEvent(event: Event): {
    sender: string
    treasury: string
    collateralSymbol: string
    collateralAmount: BigNumber
} {
    const expire = event as ExpireEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.sender).is.not.undefined
    expect(args?.treasury).is.not.undefined
    expect(args?.collateralSymbol).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return expire.args
}

/**
 * Shape check and conversion for a FullCollateralEvent.
 */
export function fullCollateralEvent(event: Event): {
    collateralSymbol: string
    collateralAmount: BigNumber
} {
    const collateral = event as FullCollateralEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.collateralSymbol).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return collateral.args
}

/**
 * Shape check and conversion for a PartialCollateralEvent.
 */
export function partialCollateralEvent(event: Event): {
    collateralSymbol: string
    collateralAmount: BigNumber
    debtSymbol: string
    debtRemaining: BigNumber
} {
    const collateral = event as PartialCollateralEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.collateralSymbol).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined
    expect(args?.debtSymbol).is.not.undefined
    expect(args?.debtRemaining).is.not.undefined

    return collateral.args
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

/**
 * Shape check and conversion for a WithdrawCollateralEvent.
 */
export function withdrawCollateralEvent(event: Event): {
    treasury: string
    collateralSymbol: string
    collateralAmount: BigNumber
} {
    const close = event as WithdrawCollateralEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.treasury).is.not.undefined
    expect(args?.collateralSymbol).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return close.args
}
