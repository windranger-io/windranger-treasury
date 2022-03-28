import {
    ActualBondMetaData,
    ActualBondSettings,
    ActualTimeLockRewardPool,
    createBondEvent
} from './bond-creator-events'
import {event} from '../../framework/events'
import {expect} from 'chai'
import {ethers} from 'hardhat'
import {ContractReceipt} from 'ethers'

export type ExpectedBondMetaData = {
    name: string
    symbol: string
    data: string
}

export type ExpectedBondSettings = {
    debtTokenAmount: bigint
    collateralTokens: string
    expiryTimestamp: bigint
    minimumDeposit: bigint
}

export type ExpectedTimeLockRewardPool = {
    tokens: string
    amount: bigint
    timeLock: bigint
}

export type ExpectedCreateBondEvent = {
    creator: string
    metadata: ExpectedBondMetaData
    configuration: ExpectedBondSettings
    rewards: ExpectedTimeLockRewardPool[]
    treasury: string
}

/**
 * Verifies the content for a Create Bond event.
 */
export async function verifyCreateBondEvent(
    expected: ExpectedCreateBondEvent,
    receipt: ContractReceipt
): Promise<void> {
    const creationEvent = createBondEvent(event('CreateBond', receipt))
    expect(ethers.utils.isAddress(creationEvent.bond)).is.true
    expect(creationEvent.bond).is.not.equal(expected.creator)
    expect(creationEvent.bond).is.not.equal(expected.treasury)
    expect(creationEvent.creator).equals(expected.creator)
    expect(creationEvent.treasury).equals(expected.treasury)
    expect(await ethers.provider.getCode(creationEvent.bond)).is.not.undefined

    verifyBondMetaData(expected.metadata, creationEvent.metadata)
    verifyBondSettings(expected.configuration, creationEvent.configuration)
    verifyTimeLockRewards(expected.rewards, creationEvent.rewards)
}

function verifyBondMetaData(
    expected: ExpectedBondMetaData,
    actual: ActualBondMetaData
): void {
    expect(expected.name).equals(actual.name)
    expect(expected.symbol).equals(actual.symbol)
    expect(expected.data).equals(actual.data)
}

function verifyBondSettings(
    expected: ExpectedBondSettings,
    actual: ActualBondSettings
): void {
    expect(expected.debtTokenAmount).equals(actual.debtTokenAmount)
    expect(expected.collateralTokens).equals(actual.collateralTokens)
    expect(expected.expiryTimestamp).equals(actual.expiryTimestamp)
    expect(expected.minimumDeposit).equals(actual.minimumDeposit)
}

function verifyTimeLockRewards(
    expected: ExpectedTimeLockRewardPool[],
    actual: ActualTimeLockRewardPool[]
): void {
    expect(expected.length).equals(actual.length)

    for (let i = 0; i < expected.length; i++) {
        verifyTimeLockRewardPool(expected[i], actual[i])
    }
}

function verifyTimeLockRewardPool(
    expected: ExpectedTimeLockRewardPool,
    actual: ActualTimeLockRewardPool
): void {
    expect(expected.tokens).equals(actual.tokens)
    expect(expected.amount).equals(actual.amount)
    expect(expected.timeLock).equals(actual.timeLock)
}
