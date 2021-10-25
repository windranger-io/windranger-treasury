import {BigNumber, ContractReceipt, Event} from 'ethers'
import {expect} from 'chai'
import {BondCreatedEvent} from '../../typechain/BondFactory'
import {
    AllowRedemptionEvent,
    DebtCertificateIssueEvent,
    RedemptionEvent
} from '../../typechain/Bond'

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
 * Shape check and conversion for a BondCreatedEvent.
 */
export function eventBondCreated(event: Event): [
    string,
    string,
    string,
    string,
    string
] & {
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
 * Shape check and conversion for a RedemptionEvent.
 */
export function eventRedemption(event: Event): [string, string, BigNumber] & {
    redeemer: string
    symbol: string
    amount: BigNumber
} {
    const debt = event as RedemptionEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.redeemer).is.not.undefined
    expect(args?.symbol).is.not.undefined
    expect(args?.amount).is.not.undefined

    return debt.args
}

/**
 * Shape check and conversion for a AllowRedemptionEvent.
 */
export function eventAllowRedemption(
    event: Event
): [string] & {authorizer: string} {
    const debt = event as AllowRedemptionEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.authorizer).is.not.undefined

    return debt.args
}

/**
 * Shape check and conversion for a DebtCertificateIssueEvent.
 */
export function eventDebtCertificateIssue(event: Event): [
    string,
    string,
    BigNumber
] & {
    receiver: string
    symbol: string
    amount: BigNumber
} {
    const debt = event as DebtCertificateIssueEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.receiver).is.not.undefined
    expect(args?.symbol).is.not.undefined
    expect(args?.amount).is.not.undefined

    return debt.args
}
