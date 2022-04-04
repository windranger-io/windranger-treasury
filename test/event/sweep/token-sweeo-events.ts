import {Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {BeneficiaryUpdateEvent} from '../../../typechain-types/contracts/sweep/TokenSweep'

export type ActualBeneficiaryUpdateEvent = {
    beneficiary: string
    instigator: string
}

/**
 * Shape check and conversion for a Beneficiary Update event.
 */
export function beneficiaryUpdateEvents(
    events: Event[]
): ActualBeneficiaryUpdateEvent[] {
    const actualEvents: ActualBeneficiaryUpdateEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as BeneficiaryUpdateEvent

        const args = create.args
        expect(args?.beneficiary).is.not.undefined
        expect(args?.instigator).is.not.undefined

        actualEvents.push(create.args)
    }

    return actualEvents
}

/**
 * Shape check and conversion for a event log entry for Beneficiary Update event.
 */
export function beneficiaryUpdateEventLogs(
    events: Result[]
): ActualBeneficiaryUpdateEvent[] {
    const results: ActualBeneficiaryUpdateEvent[] = []

    for (const event of events) {
        expect(event?.beneficiary).is.not.undefined
        expect(event?.beneficiary).to.be.a('string')
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')
        results.push({
            beneficiary: String(event.beneficiary),
            instigator: String(event.instigator)
        })
    }

    return results
}
