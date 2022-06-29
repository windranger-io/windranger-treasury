import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {
    AddCollateralWhitelistEvent,
    RemoveCollateralWhitelistEvent
} from '../../../typechain-types/contracts/performance-bonds/PerformanceBondMediator'
import {Result} from '@ethersproject/abi'

export type ActualAddCollateralEvent = {
    daoId: BigNumber
    address: string
    instigator: string
}

export type ActualRemoveCollateralEvent = {
    daoId: BigNumber
    address: string
    instigator: string
}

/**
 * Shape check and conversion for AddCollateral events.
 */
export function addCollateralEvents(
    events: Event[]
): ActualAddCollateralEvent[] {
    const tokensAdded: ActualAddCollateralEvent[] = []

    for (const event of events) {
        const collateral = event as AddCollateralWhitelistEvent
        expect(collateral.args).is.not.undefined

        const args = collateral.args
        expect(args?.daoId).is.not.undefined
        expect(args?.collateralTokens).is.not.undefined
        expect(args?.instigator).is.not.undefined

        tokensAdded.push({
            daoId: args.daoId,
            address: args.collateralTokens,
            instigator: args.instigator
        })
    }

    return tokensAdded
}

/**
 * Shape check and conversion for AddCollateral event log entries.
 */
export function addCollateralEventLogs(
    events: Result[]
): ActualAddCollateralEvent[] {
    const tokensAdded: ActualAddCollateralEvent[] = []

    for (const event of events) {
        expect(event?.daoId).is.not.undefined
        expect(event?.collateralTokens).is.not.undefined
        expect(event?.collateralTokens).to.be.a('string')
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')

        tokensAdded.push({
            daoId: BigNumber.from(event.daoId),
            address: String(event.collateralTokens),
            instigator: String(event.instigator)
        })
    }

    return tokensAdded
}

/**
 * Shape check and conversion for a RemoveCollateral event.
 */
export function removeCollateralEvents(
    events: Event[]
): ActualRemoveCollateralEvent[] {
    const tokensRemoved: ActualRemoveCollateralEvent[] = []

    for (const event of events) {
        const collateral = event as RemoveCollateralWhitelistEvent
        expect(collateral.args).is.not.undefined

        const args = collateral.args
        expect(args?.daoId).is.not.undefined
        expect(args?.collateralTokens).is.not.undefined
        expect(args?.instigator).is.not.undefined

        tokensRemoved.push({
            daoId: args.daoId,
            address: args.collateralTokens,
            instigator: args.instigator
        })
    }

    return tokensRemoved
}

/**
 * Shape check and conversion for RemoveCollateral event log entries.
 */
export function removeCollateralEventLogs(
    events: Result[]
): ActualRemoveCollateralEvent[] {
    const tokensRemoved: ActualRemoveCollateralEvent[] = []

    for (const event of events) {
        expect(event?.daoId).is.not.undefined
        expect(event?.collateralTokens).is.not.undefined
        expect(event?.collateralTokens).to.be.a('string')
        expect(event?.instigator).is.not.undefined
        expect(event?.instigator).to.be.a('string')

        tokensRemoved.push({
            daoId: BigNumber.from(event.daoId),
            address: String(event.collateralTokens),
            instigator: String(event.instigator)
        })
    }

    return tokensRemoved
}
