import {Event} from 'ethers'
import {expect} from 'chai'
import {AddCollateralEvent} from '../../../typechain-types/DaoBondCollateralWhitelist'

export type ActualAddCollateralEvent = {
    address: string
}

/**
 * Shape check and conversion for a AddBondEvent.
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
