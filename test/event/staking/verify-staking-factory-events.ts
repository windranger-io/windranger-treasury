import {event} from '../../framework/events'
import {expect} from 'chai'
import {BaseContract, ContractReceipt} from 'ethers'
import {
    ActualStakingPoolCreatedEvent,
    ExpectedStakingPoolCreatedEvent,
    stakingPoolCreated,
    stakingPoolCreatedEventLogs
} from './staking-factory-events'
import {eventLog} from '../../framework/event-logs'
import {verifyOrderedEvents} from '../../framework/verify'

export function verifyStakingPoolCreated(
    expected: ExpectedStakingPoolCreatedEvent,
    receipt: ContractReceipt
) {
    const actualStakingPoolCreatedEvent: ActualStakingPoolCreatedEvent =
        stakingPoolCreated(event('StakingPoolCreated', receipt))

    expect(actualStakingPoolCreatedEvent.config.treasury).equals(
        expected.treasury
    )
    expect(actualStakingPoolCreatedEvent.creator).equals(expected.creator)
    expect(actualStakingPoolCreatedEvent.config.rewardTokens).deep.equals(
        expected.rewardTokens
    )

    expect(actualStakingPoolCreatedEvent.config.stakeToken).equals(
        expected.stakeToken
    )
    expect(actualStakingPoolCreatedEvent.config.epochStartTimestamp).equals(
        expected.epochStartTimestamp
    )
    expect(actualStakingPoolCreatedEvent.config.epochDuration).equals(
        expected.epochDuration
    )
    expect(actualStakingPoolCreatedEvent.config.minimumContribution).equals(
        expected.minimumContribution
    )
    expect(actualStakingPoolCreatedEvent.config.rewardType).equals(
        expected.rewardType
    )
}

/**
 * Verifies the event log entries contain the expected Staking Pool created events.
 */
export function verifyStakingPoolCreatedLogEvents<T extends BaseContract>(
    emitter: T,
    receipt: ContractReceipt,
    stakingPool: ExpectedStakingPoolCreatedEvent[]
): void {
    const actualEvents = stakingPoolCreatedEventLogs(
        eventLog('StakingPoolCreated', emitter, receipt)
    )

    verifyOrderedEvents(
        actualEvents,
        stakingPool,
        (
            actual: ActualStakingPoolCreatedEvent,
            expected: ExpectedStakingPoolCreatedEvent
        ) => deepEqualsStakingPoolCreatedEvent(actual, expected)
    )
}

function deepEqualsStakingPoolCreatedEvent(
    actual: ActualStakingPoolCreatedEvent,
    expected: ExpectedStakingPoolCreatedEvent
): boolean {
    return (
        actual.config.rewardType === expected.rewardType &&
        actual.creator === expected.creator
    )
}
