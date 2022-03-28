import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {
    AllowRedemptionEvent,
    DebtIssueEvent,
    DepositEvent,
    ExpireEvent,
    FullCollateralEvent,
    PartialCollateralEvent,
    RedemptionEvent,
    SlashDepositsEvent,
    WithdrawCollateralEvent
} from '../../../typechain-types/ERC20SingleCollateralBond'

export type ActualAllowRedemptionEvent = {
    authorizer: string
    reason: string
}

export type ActualDebtIssueEvent = {
    receiver: string
    debTokens: string
    debtAmount: BigNumber
}

export type ActualDepositEvent = {
    depositor: string
    collateralTokens: string
    collateralAmount: BigNumber
}

export type ActualExpireEvent = {
    sender: string
    treasury: string
    collateralTokens: string
    collateralAmount: BigNumber
}

export type ActualFullCollateralEvent = {
    collateralTokens: string
    collateralAmount: BigNumber
}

export type ActualPartialCollateralEvent = {
    collateralTokens: string
    collateralAmount: BigNumber
    debtTokens: string
    debtRemaining: BigNumber
}

export type ActualRedemptionEvent = {
    redeemer: string
    debtTokens: string
    debtAmount: BigNumber
    collateralTokens: string
    collateralAmount: BigNumber
}

export type ActualSlashEvent = {
    collateralTokens: string
    collateralAmount: BigNumber
    reason: string
}

export type ActualWithdrawCollateralEvent = {
    treasury: string
    collateralTokens: string
    collateralAmount: BigNumber
}

/**
 * Shape check and conversion for a AllowRedemptionEvent.
 */
export function allowRedemptionEvent(event: Event): ActualAllowRedemptionEvent {
    const redemption = event as AllowRedemptionEvent
    expect(redemption.args).is.not.undefined

    const args = redemption.args
    expect(args?.authorizer).is.not.undefined

    expect(args?.reason).is.not.undefined

    return {
        authorizer: redemption.args.authorizer,
        reason: redemption.args.reason
    }
}

/**
 * Shape check and conversion for a DebtIssueEvent.
 */
export function debtIssueEvent(event: Event): ActualDebtIssueEvent {
    const debt = event as DebtIssueEvent
    expect(debt.args).is.not.undefined

    const args = debt.args
    expect(args?.receiver).is.not.undefined
    expect(args?.debTokens).is.not.undefined
    expect(args?.debtAmount).is.not.undefined

    return debt.args
}

/**
 * Shape check and conversion for a DepositEvent.
 */
export function depositEvent(event: Event): ActualDepositEvent {
    const debt = event as DepositEvent
    expect(debt.args).is.not.undefined

    const args = debt.args
    expect(args?.depositor).is.not.undefined
    expect(args?.collateralTokens).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return debt.args
}

/**
 * Shape check and conversion for a ExpireEvent.
 */
export function expireEvent(event: Event): ActualExpireEvent {
    const expire = event as ExpireEvent
    expect(expire.args).is.not.undefined

    const args = expire.args
    expect(args?.sender).is.not.undefined
    expect(args?.treasury).is.not.undefined
    expect(args?.collateralTokens).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return expire.args
}

/**
 * Shape check and conversion for a FullCollateralEvent.
 */
export function fullCollateralEvent(event: Event): ActualFullCollateralEvent {
    const collateral = event as FullCollateralEvent
    expect(collateral.args).is.not.undefined

    const args = collateral.args
    expect(args?.collateralTokens).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return collateral.args
}

/**
 * Shape check and conversion for a PartialCollateralEvent.
 */
export function partialCollateralEvent(
    event: Event
): ActualPartialCollateralEvent {
    const collateral = event as PartialCollateralEvent
    expect(collateral.args).is.not.undefined

    const args = collateral.args
    expect(args?.collateralTokens).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined
    expect(args?.debtTokens).is.not.undefined
    expect(args?.debtRemaining).is.not.undefined

    return collateral.args
}

/**
 * Shape check and conversion for a RedemptionEvent.
 */
export function redemptionEvent(event: Event): ActualRedemptionEvent {
    const debt = event as RedemptionEvent
    expect(debt.args).is.not.undefined

    const args = debt.args
    expect(args?.redeemer).is.not.undefined
    expect(args?.debtTokens).is.not.undefined
    expect(args?.debtAmount).is.not.undefined
    expect(args?.collateralTokens).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return debt.args
}

/**
 * Shape check and conversion for a SlashEvent.
 */
export function slashDepositsEvent(event: Event): ActualSlashEvent {
    const slash = event as SlashDepositsEvent
    expect(slash.args).is.not.undefined

    const args = slash.args
    expect(args?.collateralTokens).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    expect(args?.reason).is.not.undefined

    return slash.args
}

/**
 * Shape check and conversion for a WithdrawCollateralEvent.
 */
export function withdrawCollateralEvent(
    event: Event
): ActualWithdrawCollateralEvent {
    const withdraw = event as WithdrawCollateralEvent
    expect(withdraw.args).is.not.undefined

    const args = withdraw.args
    expect(args?.treasury).is.not.undefined
    expect(args?.collateralTokens).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return withdraw.args
}
