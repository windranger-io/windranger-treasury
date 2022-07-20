import {BaseContract, ContractReceipt} from 'ethers'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'
import {
    ActualStakingPoolCreatorUpdateEvent,
    ExpectedStakingPoolCreatorUpdateEvent,
    stakingPoolCreatorUpdateEventLogs
} from './staking-mediator-events'

/**
 * Verifies the event log entries contain the expected Staking Pool Creator event update
 */
export function verifyStakingPoolCreatorUpdateLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    stakingPool: ExpectedStakingPoolCreatorUpdateEvent[]
): void {
    const actualEvents = stakingPoolCreatorUpdateEventLogs(
        eventLog('StakingPoolCreatorUpdate', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        stakingPool,
        (
            actual: ActualStakingPoolCreatorUpdateEvent,
            expected: ExpectedStakingPoolCreatorUpdateEvent
        ) => deepEqualsEvents(actual, expected)
    )
}

function deepEqualsEvents(
    actual: ActualStakingPoolCreatorUpdateEvent,
    expected: ExpectedStakingPoolCreatorUpdateEvent
): boolean {
    return (
        actual.instigator === expected.instigator &&
        actual.previousCreator === expected.previousCreator &&
        actual.updateCreator === expected.updateCreator
    )
}
