import {Event} from 'ethers'
import {expect} from 'chai'
import {
    AddCollateralEvent,
    RemoveCollateralEvent
} from '../../../typechain-types/DaoBondCollateralWhitelist'

export type ActualAddCollateralEvent = {
    address: string
}

export type ActualRemoveCollateralEvent = {
    address: string
}

/**
 * Shape check and conversion for a AddCollateral event.
 */
export function addCollateralEvent(
    events: Event[]
): ActualAddCollateralEvent[] {
    const tokensAdded: ActualAddCollateralEvent[] = []

    for (const event of events) {
        const collateral = event as AddCollateralEvent
        expect(event.args).is.not.undefined

        const args = event.args
        expect(args?.collateralTokens).is.not.undefined

        const token: ActualAddCollateralEvent = {
            address: collateral.args.collateralTokens
        }

        tokensAdded.push(token)
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
        const collateral = event as RemoveCollateralEvent
        expect(event.args).is.not.undefined

        const args = event.args
        expect(args?.collateralTokens).is.not.undefined

        const token: ActualAddCollateralEvent = {
            address: collateral.args.collateralTokens
        }

        tokensRemoved.push(token)
    }

    return tokensRemoved
}
