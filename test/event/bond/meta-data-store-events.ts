import {Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {SetMetaDataEvent} from '../../../typechain-types/MetaDataStore'

export type ActualSetMetaDataEvent = {
    data: string
    instigator: string
}

/**
 * Shape check and conversion for a SetMetaData event.
 */
export function setMetaDataEvents(events: Event[]): ActualSetMetaDataEvent[] {
    const metaData: ActualSetMetaDataEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as SetMetaDataEvent

        const args = create.args
        expect(args?.data).is.not.undefined
        expect(args?.instigator).is.not.undefined

        metaData.push(create.args)
    }

    return metaData
}

/**
 * Shape check and conversion for a event log entry for SetMetaData.
 */
export function setMetaDataEventLogs(
    events: Result[]
): ActualSetMetaDataEvent[] {
    const results: ActualSetMetaDataEvent[] = []

    for (const event of events) {
        expect(event?.data).is.not.undefined
        expect(event?.data).to.be.a('string')
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')
        results.push({
            data: String(event.data),
            instigator: String(event.instigator)
        })
    }

    return results
}
