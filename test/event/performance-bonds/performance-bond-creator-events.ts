import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {
    PerformanceBond,
    CreatePerformanceBondEvent
} from '../../../typechain-types/contracts/performance-bonds/PerformanceBondFactory'

export type ActualPerformanceBondMetaData = {
    name: string
    symbol: string
    data: string
}

export type ActualPerformanceBondSettings = {
    debtTokenAmount: BigNumber
    collateralTokens: string
    expiryTimestamp: BigNumber
    minimumDeposit: BigNumber
}

export type ActualTimeLockRewardPool = {
    tokens: string
    amount: BigNumber
    timeLock: BigNumber
}

export type ActualCreatePerformanceBondEvent = {
    bond: string
    metadata: ActualPerformanceBondMetaData
    configuration: ActualPerformanceBondSettings
    rewards: ActualTimeLockRewardPool[]
    treasury: string
    instigator: string
}

/**
 * Shape check and conversion for CreatePerformanceBondEvents.
 */
export function createPerformanceBondEvents(
    events: Event[]
): ActualCreatePerformanceBondEvent[] {
    const creations: ActualCreatePerformanceBondEvent[] = []

    for (const event of events) {
        const create = event as CreatePerformanceBondEvent
        expect(event.args).is.not.undefined

        const args = create.args
        expect(args?.bond).is.not.undefined
        expect(args?.metadata).is.not.undefined
        expect(args?.configuration).is.not.undefined
        expect(args?.rewards).is.not.undefined
        expect(args?.treasury).is.not.undefined
        expect(args?.instigator).is.not.undefined

        creations.push({
            bond: args.bond,
            metadata: createBondMetaData(
                args.metadata as PerformanceBond.MetaDataStruct
            ),
            configuration: createBondConfiguration(
                args.configuration as PerformanceBond.SettingsStruct
            ),
            rewards: createRewardPools(
                args.rewards as PerformanceBond.TimeLockRewardPoolStruct[]
            ),
            treasury: args.treasury,
            instigator: args.instigator
        })
    }

    return creations
}

/**
 * Shape check and conversion for an event log entry for CreatePerformanceBond.
 */
export function createPerformanceBondEventLogs(
    events: Result[]
): ActualCreatePerformanceBondEvent[] {
    const results: ActualCreatePerformanceBondEvent[] = []

    for (const event of events) {
        expect(event?.bond).is.not.undefined
        expect(event?.metadata).is.not.undefined
        expect(event?.configuration).is.not.undefined
        expect(event?.rewards).is.not.undefined
        expect(event?.treasury).is.not.undefined
        expect(event?.instigator).is.not.undefined

        results.push({
            bond: String(event.bond),
            metadata: createBondMetaData(
                event?.metadata as PerformanceBond.MetaDataStruct
            ),
            configuration: createBondConfiguration(
                event?.configuration as PerformanceBond.SettingsStruct
            ),
            rewards: createRewardPools(
                event?.rewards as PerformanceBond.TimeLockRewardPoolStruct[]
            ),
            treasury: String(event.treasury),
            instigator: String(event.instigator)
        })
    }

    return results
}

function createRewardPools(
    rewards: PerformanceBond.TimeLockRewardPoolStruct[]
): ActualTimeLockRewardPool[] {
    const rewardPools: ActualTimeLockRewardPool[] = []

    for (const reward of rewards) {
        expect(reward?.tokens).is.not.undefined
        expect(reward?.amount).is.not.undefined
        expect(reward?.timeLock).is.not.undefined

        rewardPools.push({
            tokens: String(reward.tokens),
            amount: BigNumber.from(reward.amount),
            timeLock: BigNumber.from(reward.timeLock)
        })
    }

    return rewardPools
}

function createBondConfiguration(
    config: PerformanceBond.SettingsStruct
): ActualPerformanceBondSettings {
    expect(config.debtTokenAmount).is.not.undefined
    expect(config?.collateralTokens).is.not.undefined
    expect(config?.expiryTimestamp).is.not.undefined
    expect(config?.minimumDeposit).is.not.undefined

    return {
        debtTokenAmount: BigNumber.from(config.debtTokenAmount),
        collateralTokens: String(config.collateralTokens),
        expiryTimestamp: BigNumber.from(config.expiryTimestamp),
        minimumDeposit: BigNumber.from(config.minimumDeposit)
    }
}

function createBondMetaData(
    metaData: PerformanceBond.MetaDataStruct
): ActualPerformanceBondMetaData {
    expect(metaData?.name).is.not.undefined
    expect(metaData?.symbol).is.not.undefined
    expect(metaData?.data).is.not.undefined

    return {
        name: String(metaData.name),
        symbol: String(metaData.symbol),
        data: String(metaData.data)
    }
}
