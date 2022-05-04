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
}

export type ActualDepositEvent = {
    depositor: string
    collateralTokens: string
    collateralAmount: BigNumber
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
 * Shape check and conversion for an event log entry for AllowRedemption events.
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
 * Shape check and conversion for DebtIssueEvents.
 */
export function debtIssueEvents(events: Event[]): ActualDebtIssueEvent[] {
    const debtIssues: ActualDebtIssueEvent[] = []

    for (const event of events) {
        const debt = event as DebtIssueEvent
        expect(debt.args).is.not.undefined

        const args = debt.args
        expect(args?.receiver).is.not.undefined
        expect(args?.debTokens).is.not.undefined
        expect(args?.debtAmount).is.not.undefined

        debtIssues.push({
            receiver: args?.receiver,
            debTokens: args?.debTokens,
            debtAmount: args?.debtAmount
        })
    }

    return debtIssues
}

/**
 * Shape check and conversion for an event log entry for DebtIssue events.
 */
export function debtIssueEventLogs(events: Result[]): ActualDebtIssueEvent[] {
    const debtIssues: ActualDebtIssueEvent[] = []

    for (const event of events) {
        expect(event?.receiver).is.not.undefined
        expect(event?.receiver).to.be.a('string')
        expect(event?.debTokens).is.not.undefined
        expect(event?.debTokens).to.be.a('string')
        expect(event?.debtAmount).is.not.undefined

        debtIssues.push({
            receiver: String(event.receiver),
            debTokens: String(event.debTokens),
            debtAmount: BigNumber.from(event.debtAmount)
        })
    }

    return debtIssues
}

/**
 * Shape check and conversion for DepositEvents.
 */
export function depositEvents(events: Event[]): ActualDepositEvent[] {
    const deposits: ActualDepositEvent[] = []

    for (const event of events) {
        const debt = event as DepositEvent
        expect(debt.args).is.not.undefined

        const args = debt.args
        expect(args?.depositor).is.not.undefined
        expect(args?.collateralTokens).is.not.undefined
        expect(args?.collateralAmount).is.not.undefined

        deposits.push({
            depositor: args?.depositor,
            collateralTokens: args?.collateralTokens,
            collateralAmount: args?.collateralAmount
        })
    }

    return deposits
}

/**
 * Shape check and conversion for an event log entry for Deposit events.
 */
export function depositEventLogs(events: Result[]): ActualDepositEvent[] {
    const deposits: ActualDepositEvent[] = []

    for (const event of events) {
        expect(event?.depositor).is.not.undefined
        expect(event?.depositor).to.be.a('string')
        expect(event?.collateralTokens).is.not.undefined
        expect(event?.collateralTokens).to.be.a('string')
        expect(event?.collateralAmount).is.not.undefined

        deposits.push({
            depositor: String(event.depositor),
            collateralTokens: String(event.collateralTokens),
            collateralAmount: BigNumber.from(event.collateralAmount)
        })
    }

    return deposits
}

/**
 * Shape check and conversion for ExpireEvents.
 */
export function expireEvents(events: Event[]): ActualExpireEvent[] {
    const expiry: ActualExpireEvent[] = []

    for (const event of events) {
        const expire = event as ExpireEvent
        expect(expire.args).is.not.undefined

        const args = expire.args
        expect(args?.treasury).is.not.undefined
        expect(args?.collateralTokens).is.not.undefined
        expect(args?.collateralAmount).is.not.undefined
        expect(args?.instigator).is.not.undefined

        expiry.push({
            treasury: args?.treasury,
            collateralTokens: args?.collateralTokens,
            collateralAmount: args?.collateralAmount,
            instigator: args?.instigator
        })
    }

    return expiry
}

/**
 * Shape check and conversion for an event log entry for Expire events.
 */
export function expireEventLogs(events: Result[]): ActualExpireEvent[] {
    const expire: ActualExpireEvent[] = []

    for (const event of events) {
        expect(event?.treasury).is.not.undefined
        expect(event?.treasury).to.be.a('string')
        expect(event?.collateralAmount).is.not.undefined
        expect(event?.collateralTokens).to.be.a('string')
        expect(event?.collateralAmount).is.not.undefined
        expect(event?.instigator).to.be.a('string')
        expect(event?.instigator).is.not.undefined

        expire.push({
            treasury: String(event.treasury),
            collateralTokens: String(event.collateralTokens),
            collateralAmount: BigNumber.from(event.collateralAmount),
            instigator: String(event.instigator)
        })
    }

    return expire
}

/**
 * Shape check and conversion for FullCollateralEvents.
 */
export function fullCollateralEvents(
    events: Event[]
): ActualFullCollateralEvent[] {
    const collateralEvents: ActualFullCollateralEvent[] = []

    for (const event of events) {
        const collateral = event as FullCollateralEvent
        expect(collateral.args).is.not.undefined

        const args = collateral.args
        expect(args?.collateralTokens).is.not.undefined
        expect(args?.collateralAmount).is.not.undefined
        expect(args?.instigator).is.not.undefined

        collateralEvents.push({
            collateralTokens: args.collateralTokens,
            collateralAmount: args.collateralAmount,
            instigator: args.instigator
        })
    }

    return collateralEvents
}

/**
 * Shape check and conversion for an event log entry for FullCollateral events.
 */
export function fullCollateralEventLogs(
    events: Result[]
): ActualFullCollateralEvent[] {
    const collateralEvents: ActualFullCollateralEvent[] = []

    for (const event of events) {
        expect(event?.collateralTokens).is.not.undefined
        expect(event?.collateralTokens).to.be.a('string')
        expect(event?.collateralAmount).is.not.undefined
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')

        collateralEvents.push({
            collateralTokens: String(event.collateralTokens),
            collateralAmount: BigNumber.from(event.collateralAmount),
            instigator: String(event.instigator)
        })
    }

    return collateralEvents
}

/**
 * Shape check and conversion for PartialCollateralEvents.
 */
export function partialCollateralEvents(
    events: Event[]
): ActualPartialCollateralEvent[] {
    const collateralEvents: ActualPartialCollateralEvent[] = []

    for (const event of events) {
        const collateral = event as PartialCollateralEvent
        expect(collateral.args).is.not.undefined

        const args = collateral.args
        expect(args?.collateralTokens).is.not.undefined
        expect(args?.collateralAmount).is.not.undefined
        expect(args?.debtTokens).is.not.undefined
        expect(args?.debtRemaining).is.not.undefined
        expect(args?.instigator).is.not.undefined

        collateralEvents.push({
            collateralTokens: args.collateralTokens,
            collateralAmount: args.collateralAmount,
            debtTokens: args.debtTokens,
            debtRemaining: args.debtRemaining,
            instigator: args.instigator
        })
    }

    return collateralEvents
}

/**
 * Shape check and conversion for an event log entry for PartialCollateral events.
 */
export function partialCollateralEventLogs(
    events: Result[]
): ActualPartialCollateralEvent[] {
    const collateralEvents: ActualPartialCollateralEvent[] = []

    for (const event of events) {
        expect(event?.collateralTokens).is.not.undefined
        expect(event?.collateralTokens).to.be.a('string')
        expect(event?.collateralAmount).is.not.undefined
        expect(event?.debtTokens).is.not.undefined
        expect(event?.debtTokens).to.be.a('string')
        expect(event?.debtRemaining).is.not.undefined
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')

        collateralEvents.push({
            collateralTokens: String(event.collateralTokens),
            collateralAmount: BigNumber.from(event.collateralAmount),
            debtTokens: String(event.debtTokens),
            debtRemaining: BigNumber.from(event.debtRemaining),
            instigator: String(event.instigator)
        })
    }

    return collateralEvents
}

/**
 * Shape check and conversion for RedemptionEvents.
 */
export function redemptionEvents(events: Event[]): ActualRedemptionEvent[] {
    const redemptions: ActualRedemptionEvent[] = []

    for (const event of events) {
        const redemption = event as RedemptionEvent
        expect(redemption.args).is.not.undefined

        const args = redemption.args
        expect(args?.redeemer).is.not.undefined
        expect(args?.debtTokens).is.not.undefined
        expect(args?.debtAmount).is.not.undefined
        expect(args?.collateralTokens).is.not.undefined
        expect(args?.collateralAmount).is.not.undefined

        redemptions.push({
            collateralTokens: args.collateralTokens,
            collateralAmount: args.collateralAmount,
            debtTokens: args.debtTokens,
            debtAmount: args.debtAmount,
            redeemer: args.redeemer
        })
    }

    return redemptions
}

/**
 * Shape check and conversion for an event log entry for Redemption events.
 */
export function redemptionEventLogs(events: Result[]): ActualRedemptionEvent[] {
    const redemptions: ActualRedemptionEvent[] = []

    for (const event of events) {
        expect(event?.collateralTokens).is.not.undefined
        expect(event?.collateralTokens).to.be.a('string')
        expect(event?.collateralAmount).is.not.undefined
        expect(event?.debtTokens).is.not.undefined
        expect(event?.debtTokens).to.be.a('string')
        expect(event?.debtAmount).is.not.undefined
        expect(event?.redeemer).is.not.undefined
        expect(event?.redeemer).to.be.a('string')

        redemptions.push({
            collateralTokens: String(event.collateralTokens),
            collateralAmount: BigNumber.from(event.collateralAmount),
            debtTokens: String(event.debtTokens),
            debtAmount: BigNumber.from(event.debtAmount),
            redeemer: String(event.redeemer)
        })
    }

    return redemptions
}

// TODO marker
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
