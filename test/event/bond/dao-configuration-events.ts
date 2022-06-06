import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {
    DaoMetaDataUpdateEvent,
    DaoTreasuryUpdateEvent
} from '../../../typechain-types/contracts/DaoConfiguration'

export type ActualDaoTreasuryUpdateEvent = {
    daoId: BigNumber
    treasury: string
    instigator: string
}

export type ActualDaoMetaDataUpdateEvent = {
    daoId: BigNumber
    data: string
    instigator: string
}

/**
 * Shape check and conversion for a DaoMetaDataUpdate event.
 */
export function daoMetaDataUpdateEvents(
    events: Event[]
): ActualDaoMetaDataUpdateEvent[] {
    const metaData: ActualDaoMetaDataUpdateEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as DaoMetaDataUpdateEvent

        const args = create.args
        expect(args?.daoId).is.not.undefined
        expect(args?.data).is.not.undefined
        expect(args?.instigator).is.not.undefined

        metaData.push(create.args)
    }

    return metaData
}

/**
 * Shape check and conversion for an event log entry for DaoMetaDataUpdate.
 */
export function daoMetaDataUpdateEventLogs(
    events: Result[]
): ActualDaoMetaDataUpdateEvent[] {
    const results: ActualDaoMetaDataUpdateEvent[] = []

    for (const event of events) {
        expect(event?.daoId).is.not.undefined
        expect(event?.data).is.not.undefined
        expect(event?.data).to.be.a('string')
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')

        results.push({
            daoId: BigNumber.from(event.daoId),
            data: String(event.data),
            instigator: String(event.instigator)
        })
    }

    return results
}

/**
 * Shape check and conversion for a DaoTreasuryUpdate event.
 */
export function daoTreasuryUpdateEvents(
    events: Event[]
): ActualDaoTreasuryUpdateEvent[] {
    const metaData: ActualDaoTreasuryUpdateEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as DaoTreasuryUpdateEvent

        const args = create.args
        expect(args?.daoId).is.not.undefined
        expect(args?.treasury).is.not.undefined
        expect(args?.instigator).is.not.undefined

        metaData.push(create.args)
    }

    return metaData
}

/**
 * Shape check and conversion for an event log entry for DaoTreasuryUpdate.
 */
export function daoTreasuryUpdateEventLogs(
    events: Result[]
): ActualDaoTreasuryUpdateEvent[] {
    const results: ActualDaoTreasuryUpdateEvent[] = []

    for (const event of events) {
        expect(event?.daoId).is.not.undefined
        expect(event?.treasury).is.not.undefined
        expect(event?.treasury).to.be.a('string')
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')

        results.push({
            daoId: BigNumber.from(event.daoId),
            treasury: String(event.treasury),
            instigator: String(event.instigator)
        })
    }

    return results
}
