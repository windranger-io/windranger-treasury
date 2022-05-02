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
} from '../../../typechain-types/contracts/bond/ERC20SingleCollateralBond'
import {Result} from '@ethersproject/abi'

export type ActualAllowRedemptionEvent = {
    authorizer: string
    reason: string
}

export type ActualDebtIssueEvent = {
    receiver: string
    debTokens: string
    debtAmount: BigNumber
    instigator: string
}

export type ActualDepositEvent = {
    depositor: string
    collateralTokens: string
    collateralAmount: BigNumber
    instigator: string
}

export type ActualExpireEvent = {
    treasury: string
    collateralTokens: string
    collateralAmount: BigNumber
    instigator: string
}

export type ActualFullCollateralEvent = {
    collateralTokens: string
    collateralAmount: BigNumber
    instigator: string
}

export type ActualPartialCollateralEvent = {
    collateralTokens: string
    collateralAmount: BigNumber
    debtTokens: string
    debtRemaining: BigNumber
    instigator: string
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
    instigator: string
}

export type ActualWithdrawCollateralEvent = {
    treasury: string
    collateralTokens: string
    collateralAmount: BigNumber
    instigator: string
}

/**
 * Shape check and conversion for AllowRedemptionEvent.
 */
export function allowRedemptionEvents(
    events: Event[]
): ActualAllowRedemptionEvent[] {
    const redemptions: ActualAllowRedemptionEvent[] = []

    for (const event of events) {
        const redemption = event as AllowRedemptionEvent
        expect(redemption.args).is.not.undefined

        const args = redemption.args
        expect(args?.authorizer).is.not.undefined
        expect(args?.reason).is.not.undefined

        redemptions.push({
            authorizer: args.authorizer,
            reason: args.reason
        })
    }

    return redemptions
}

/**
 * Shape check and conversion for an event log entry for AllowRedemption event.
 */
export function allowRedemptionEventLogs(
    events: Result[]
): ActualAllowRedemptionEvent[] {
    const redemptions: ActualAllowRedemptionEvent[] = []

    for (const event of events) {
        expect(event?.authorizer).is.not.undefined
        expect(event?.authorizer).to.be.a('string')
        expect(event?.reason).is.not.undefined
        expect(event?.reason).to.be.a('string')

        redemptions.push({
            authorizer: String(event.authorizer),
            reason: String(event.reason)
        })
    }

    return redemptions
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
    expect(args?.instigator).is.not.undefined

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
    expect(args?.instigator).is.not.undefined

    return debt.args
}

/**
 * Shape check and conversion for a ExpireEvent.
 */
export function expireEvent(event: Event): ActualExpireEvent {
    const expire = event as ExpireEvent
    expect(expire.args).is.not.undefined

    const args = expire.args
    expect(args?.treasury).is.not.undefined
    expect(args?.collateralTokens).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined
    expect(args?.instigator).is.not.undefined

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
    expect(args?.instigator).is.not.undefined

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
    expect(args?.instigator).is.not.undefined

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
    expect(args?.instigator).is.not.undefined

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
    expect(args?.instigator).is.not.undefined

    return withdraw.args
}
