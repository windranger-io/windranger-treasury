import {ContractReceipt, Event} from 'ethers'
import {expect} from 'chai'

export function validateEvents(receipt: ContractReceipt): Event[] {
    expect(receipt.events).is.not.undefined
    const events = receipt.events
    expect(events).is.not.undefined
    return events ? events : []
}
