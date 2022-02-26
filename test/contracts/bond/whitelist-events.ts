import {Event} from 'ethers'
import {expect} from 'chai'
import {CollateralAddedEvent} from '../../../typechain-types/DaoBondCollateralWhitelist'

export type ActualAddCollateralEvent = {
    address: string
    symbol: string
}

/**
 * Shape check and conversion for a AddBondEvent.
 */
export function addCollateralEvent(
    events: Event[]
): ActualAddCollateralEvent[] {
    const tokensAdded: ActualAddCollateralEvent[] = []

    for (const event of events) {
        const collateral = event as CollateralAddedEvent
        expect(event.args).is.not.undefined

        const args = event.args
        expect(args?.symbol).is.not.undefined
        expect(args?.collateralTokens).is.not.undefined

        const token: ActualAddCollateralEvent = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            address: args?.collateralTokens,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            symbol: args?.symbol
        }

        tokensAdded.push(token)
    }

    return tokensAdded
}
