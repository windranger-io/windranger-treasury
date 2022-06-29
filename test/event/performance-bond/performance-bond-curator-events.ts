import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {AddPerformanceBondEvent} from '../../../typechain-types/contracts/performance-bonds/PerformanceBondCurator'

export type ActualAddPerformanceBondEvent = {
    daoId: BigNumber
    bond: string
    instigator: string
}

/**
 * Shape check and conversion for a AddPerformanceBondEvent.
 */
export function addPerformanceBondEvents(
    events: Event[]
): ActualAddPerformanceBondEvent[] {
    const bonds: ActualAddPerformanceBondEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as AddPerformanceBondEvent

        const args = create.args
        expect(args?.daoId).is.not.undefined
        expect(args?.bond).is.not.undefined
        expect(args?.instigator).is.not.undefined

        bonds.push(create.args)
    }

    return bonds
}

/**
 * Shape check and conversion for a event log entry for AddPerformanceBond.
 */
export function addPerformanceBondEventLogs(
    events: Result[]
): ActualAddPerformanceBondEvent[] {
    const results: ActualAddPerformanceBondEvent[] = []

    for (const event of events) {
        expect(event?.daoId).is.not.undefined
        expect(event?.bond).is.not.undefined
        expect(event?.bond).to.be.a('string')
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')
        results.push({
            daoId: BigNumber.from(event.daoId),
            bond: String(event.bond),
            instigator: String(event.instigator)
        })
    }

    return results
}
