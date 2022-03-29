import {Event} from 'ethers'
import {expect} from 'chai'
import {
    AddCollateralWhitelistEvent,
    RemoveCollateralWhitelistEvent
} from '../../../typechain-types/DaoBondConfiguration'

export type ActualAddCollateralEvent = {
    address: string
    instigator: string
}

export type ActualRemoveCollateralEvent = {
    address: string
    instigator: string
}

/**
 * Shape check and conversion for a AddCollateral event.
 */
export function addCollateralEvent(
    events: Event[]
): ActualAddCollateralEvent[] {
    const tokensAdded: ActualAddCollateralEvent[] = []

    for (const event of events) {
        const collateral = event as AddCollateralWhitelistEvent
        expect(collateral.args).is.not.undefined

        const args = collateral.args
        expect(args?.collateralTokens).is.not.undefined
        expect(args?.instigator).is.not.undefined

        tokensAdded.push({
            address: args.collateralTokens,
            instigator: args.instigator
        })
    }

    return tokensAdded
}

/**
 * Shape check and conversion for a RemoveCollateral event.
 */
export function removeCollateralEvent(
    events: Event[]
): ActualRemoveCollateralEvent[] {
    const tokensRemoved: ActualRemoveCollateralEvent[] = []

    for (const event of events) {
        const collateral = event as RemoveCollateralWhitelistEvent
        expect(collateral.args).is.not.undefined

        const args = collateral.args
        expect(args?.collateralTokens).is.not.undefined
        expect(args?.instigator).is.not.undefined

        tokensRemoved.push({
            address: args.collateralTokens,
            instigator: args.instigator
        })
    }

    return tokensRemoved
}
