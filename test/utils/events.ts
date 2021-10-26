import {BigNumber, ContractReceipt, Event} from 'ethers'
import {expect} from 'chai'
import {BondCreatedEvent} from '../../typechain/BondFactory'
import {
    AllowRedemptionEvent,
    DebtCertificateIssueEvent,
    RedemptionEvent,
    SlashEvent
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
 * Shape check and conversion for a DebtCertificateIssueEvent.
 */
export function debtCertificateIssueEvent(event: Event): {
    receiver: string
    debSymbol: string
    debtAmount: BigNumber
} {
    const debt = event as DebtCertificateIssueEvent
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
    securitySymbol: string
    securityAmount: BigNumber
} {
    const debt = event as RedemptionEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.redeemer).is.not.undefined
    expect(args?.debtSymbol).is.not.undefined
    expect(args?.debtAmount).is.not.undefined
    expect(args?.securitySymbol).is.not.undefined
    expect(args?.securityAmount).is.not.undefined

    return debt.args
}

/**
 * Shape check and conversion for a SlashEvent.
 */
export function slashEvent(event: Event): {
    securitySymbol: string
    securityAmount: BigNumber
} {
    const debt = event as SlashEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.securitySymbol).is.not.undefined
    expect(args?.securityAmount).is.not.undefined

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

export async function verifyDebtCertificateIssueEvent(
    receipt: ContractReceipt,
    guarantor: string,
    debt: ExpectTokenBalance
): Promise<void> {
    const depositOneEvent = debtCertificateIssueEvent(
        event('DebtCertificateIssue', events(receipt))
    )
    expect(depositOneEvent.receiver, 'Debt Certificate receiver').equals(
        guarantor
    )
    expect(depositOneEvent.debSymbol, 'Debt Certificate symbol').equals(
        debt.symbol
    )
    expect(depositOneEvent.debtAmount, 'Debt Certificate amount').equals(
        debt.amount
    )
}

export async function verifyRedemptionEvent(
    receipt: ContractReceipt,
    redeemer: string,
    debt: ExpectTokenBalance,
    security: ExpectTokenBalance
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
        redemptionTwoEvent.securitySymbol,
        'Redemption security symbol'
    ).equals(security.symbol)
    expect(
        redemptionTwoEvent.securityAmount,
        'Redemption security amount'
    ).equals(security.amount)
}
