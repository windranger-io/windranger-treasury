import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {
    AllowRedemptionEvent,
    DebtIssueEvent,
    ExpireEvent,
    FullCollateralEvent,
    PartialCollateralEvent,
    RedemptionEvent,
    SlashEvent,
    WithdrawCollateralEvent
} from '../../../typechain/Bond'
import {TransferEvent} from '../../../typechain/IERC20'

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
