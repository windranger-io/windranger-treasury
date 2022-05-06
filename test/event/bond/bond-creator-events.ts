import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'
import {
    Bond,
    CreateBondEvent
} from '../../../typechain-types/contracts/bond/BondFactory'

export type ActualBondMetaData = {
    name: string
    symbol: string
    data: string
}

export type ActualBondSettings = {
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

export type ActualCreateBondEvent = {
    bond: string
    metadata: ActualBondMetaData
    configuration: ActualBondSettings
    rewards: ActualTimeLockRewardPool[]
    treasury: string
    instigator: string
}

/**
 * Shape check and conversion for CreateBondEvents.
 */
export function createBondEvents(events: Event[]): ActualCreateBondEvent[] {
    const creations: ActualCreateBondEvent[] = []

    for (const event of events) {
        const create = event as CreateBondEvent
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
            metadata: createBondMetaData(args.metadata as Bond.MetaDataStruct),
            configuration: createBondConfiguration(
                args.configuration as Bond.SettingsStruct
            ),
            rewards: createRewardPools(
                args.rewards as Bond.TimeLockRewardPoolStruct[]
            ),
            treasury: args.treasury,
            instigator: args.instigator
        })
    }

    return creations
}

/**
 * Shape check and conversion for an event log entry for CreateBond.
 */
export function createBondEventLogs(events: Result[]): ActualCreateBondEvent[] {
    const results: ActualCreateBondEvent[] = []

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
                event?.metadata as Bond.MetaDataStruct
            ),
            configuration: createBondConfiguration(
                event?.configuration as Bond.SettingsStruct
            ),
            rewards: createRewardPools(
                event?.rewards as Bond.TimeLockRewardPoolStruct[]
            ),
            treasury: String(event.treasury),
            instigator: String(event.instigator)
        })
    }

    return results
}

function createRewardPools(
    rewards: Bond.TimeLockRewardPoolStruct[]
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
    config: Bond.SettingsStruct
): ActualBondSettings {
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

function createBondMetaData(metaData: Bond.MetaDataStruct): ActualBondMetaData {
    expect(metaData?.name).is.not.undefined
    expect(metaData?.symbol).is.not.undefined
    expect(metaData?.data).is.not.undefined

    return {
        name: String(metaData.name),
        symbol: String(metaData.symbol),
        data: String(metaData.data)
    }
}
