import {Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {MetaDataUpdateEvent} from '../../../typechain-types/contracts/bond/MetaDataStore'

export type ActualMetaDataUpdateEvent = {
    data: string
    instigator: string
}

/**
 * Shape check and conversion for a MetaDataUpdate event.
 */
export function metaDataUpdateEvents(
    events: Event[]
): ActualMetaDataUpdateEvent[] {
    const metaData: ActualMetaDataUpdateEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as MetaDataUpdateEvent

        const args = create.args
        expect(args?.data).is.not.undefined
        expect(args?.instigator).is.not.undefined

        metaData.push(create.args)
    }

    return metaData
}

/**
 * Shape check and conversion for a event log entry for MetaDataUpdate.
 */
export function metaDataUpdateEventLogs(
    events: Result[]
): ActualMetaDataUpdateEvent[] {
    const results: ActualMetaDataUpdateEvent[] = []

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
