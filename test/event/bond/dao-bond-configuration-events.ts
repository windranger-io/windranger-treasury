import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {
    SetDaoTreasuryEvent,
    SetMetaDataEvent
} from '../../../typechain-types/DaoBondConfiguration'

export type ActualSetDaoTreasuryEvent = {
    daoId: BigNumber
    treasury: string
    instigator: string
}

export type ActualSetDaoMetaDataEvent = {
    daoId: BigNumber
    data: string
    instigator: string
}

/**
 * Shape check and conversion for a SetDaoMetaData event.
 */
export function setDaoMetaDataEvents(
    events: Event[]
): ActualSetDaoMetaDataEvent[] {
    const metaData: ActualSetDaoMetaDataEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as SetMetaDataEvent

        const args = create.args
        expect(args?.daoId).is.not.undefined
        expect(args?.data).is.not.undefined
        expect(args?.instigator).is.not.undefined

        metaData.push(create.args)
    }

    return metaData
}

/**
 * Shape check and conversion for an event log entry for SetDaoMetaData.
 */
export function setDaoMetaDataEventLogs(
    events: Result[]
): ActualSetDaoMetaDataEvent[] {
    const results: ActualSetDaoMetaDataEvent[] = []

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
 * Shape check and conversion for a SetDaoTreasury event.
 */
export function setDaoTreasuryEvents(
    events: Event[]
): ActualSetDaoTreasuryEvent[] {
    const metaData: ActualSetDaoTreasuryEvent[] = []

    for (const event of events) {
        expect(event.args).is.not.undefined
        const create = event as SetDaoTreasuryEvent

        const args = create.args
        expect(args?.daoId).is.not.undefined
        expect(args?.treasury).is.not.undefined
        expect(args?.instigator).is.not.undefined

        metaData.push(create.args)
    }

    return metaData
}

/**
 * Shape check and conversion for an event log entry for SetDaoTreasury.
 */
export function setDaoTreasuryEventLogs(
    events: Result[]
): ActualSetDaoTreasuryEvent[] {
    const results: ActualSetDaoTreasuryEvent[] = []

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
