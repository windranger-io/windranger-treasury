import {event} from '../../framework/events'
import {expect} from 'chai'
import {ContractReceipt} from 'ethers'
import {
    ActualStakingPoolCreatedEvent,
    ExpectedStakingPoolCreatedEvent,
    stakingPoolCreated
} from './staking-factory-events'

export function verifyStakingPoolCreated(
    expected: ExpectedStakingPoolCreatedEvent,
    receipt: ContractReceipt
) {
    const actualStakingPoolCreatedEvent: ActualStakingPoolCreatedEvent =
        stakingPoolCreated(event('StakingPoolCreated', receipt))

    expect(actualStakingPoolCreatedEvent.treasury).equals(expected.treasury)
    expect(actualStakingPoolCreatedEvent.creator).equals(expected.creator)
    expect(actualStakingPoolCreatedEvent.rewardTokens).deep.equals(
        expected.rewardTokens
    )

    expect(actualStakingPoolCreatedEvent.stakeToken).equals(expected.stakeToken)
    expect(actualStakingPoolCreatedEvent.epochStartTimestamp).equals(
        expected.epochStartTimestamp
    )
    expect(actualStakingPoolCreatedEvent.epochDuration).equals(
        expected.epochDuration
    )
    expect(actualStakingPoolCreatedEvent.minimumContribution).equals(
        expected.minimumContribution
    )
    expect(actualStakingPoolCreatedEvent.rewardType).equals(expected.rewardType)
}
