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
    const redemption = event as AllowRedemptionEvent
    expect(redemption.args).is.not.undefined

    const args = redemption.args
    expect(args?.authorizer).is.not.undefined

    return redemption.args
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
    expect(debt.args).is.not.undefined

    const args = debt.args
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
    expect(expire.args).is.not.undefined

    const args = expire.args
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
    expect(collateral.args).is.not.undefined

    const args = collateral.args
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
    expect(collateral.args).is.not.undefined

    const args = collateral.args
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
    expect(debt.args).is.not.undefined

    const args = debt.args
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
    const slash = event as SlashEvent
    expect(slash.args).is.not.undefined

    const args = slash.args
    expect(args?.collateralSymbol).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return slash.args
}

/**
 * Shape check and conversion for a TransferEvents.
 */
export function transferEvents(events: Event[]): {
    from: string
    to: string
    value: BigNumber
}[] {
    const converted: {
        from: string
        to: string
        value: BigNumber
    }[] = []

    for (let i = 0; i < events.length; i++) {
        const transfer = events[i] as TransferEvent
        expect(transfer.args).is.not.undefined

        const args = events[i].args
        expect(args?.from).is.not.undefined
        expect(args?.to).is.not.undefined
        expect(args?.value).is.not.undefined

        converted.push(transfer.args)
    }

    return converted
}

/**
 * Shape check and conversion for a WithdrawCollateralEvent.
 */
export function withdrawCollateralEvent(event: Event): {
    treasury: string
    collateralSymbol: string
    collateralAmount: BigNumber
} {
    const withdraw = event as WithdrawCollateralEvent
    expect(withdraw.args).is.not.undefined

    const args = withdraw.args
    expect(args?.treasury).is.not.undefined
    expect(args?.collateralSymbol).is.not.undefined
    expect(args?.collateralAmount).is.not.undefined

    return withdraw.args
}
