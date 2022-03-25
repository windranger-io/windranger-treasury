import {BigNumber, Event} from 'ethers'
import {expect} from 'chai'
import {Bond, CreateBondEvent} from '../../../typechain-types/BondCreator'
import {Result} from '@ethersproject/abi'
import TimeLockRewardPoolStruct = Bond.TimeLockRewardPoolStruct
import SettingsStruct = Bond.SettingsStruct
import MetaDataStruct = Bond.MetaDataStruct

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
    creator: string
    bond: string
    metadata: ActualBondMetaData
    configuration: ActualBondSettings
    rewards: ActualTimeLockRewardPool[]
    treasury: string
}

/**
 * Shape check and conversion for a CreateBondEvent.
 */
export function createBondEvent(event: Event): ActualCreateBondEvent {
    const create = event as CreateBondEvent
    expect(event.args).is.not.undefined

    const args = event.args
    expect(args?.creator).is.not.undefined
    expect(args?.bond).is.not.undefined
    expect(args?.metadata).is.not.undefined
    expect(args?.configuration).is.not.undefined
    expect(args?.rewards).is.not.undefined
    expect(args?.treasury).is.not.undefined

    return create.args
}

/**
 * Shape check and conversion for an event log entry for CreateBond.
 */
export function createBondEventLogs(events: Result[]): ActualCreateBondEvent[] {
    const results: ActualCreateBondEvent[] = []

    for (const event of events) {
        expect(event?.creator).is.not.undefined
        expect(event?.bond).is.not.undefined
        expect(event?.metadata).is.not.undefined
        expect(event?.configuration).is.not.undefined
        expect(event?.rewards).is.not.undefined
        expect(event?.treasury).is.not.undefined

        results.push({
            creator: String(event.creator),
            bond: String(event.bond),
            metadata: createBondMetaData(event?.metadata as MetaDataStruct),
            configuration: createBondConfiguration(
                event?.configuration as SettingsStruct
            ),
            rewards: createRewardPools(
                event?.rewards as TimeLockRewardPoolStruct[]
            ),
            treasury: String(event.treasury)
        })
    }

    return results
}

function createRewardPools(
    rewards: TimeLockRewardPoolStruct[]
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

function createBondConfiguration(config: SettingsStruct): ActualBondSettings {
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

function createBondMetaData(metaData: MetaDataStruct): ActualBondMetaData {
    expect(metaData?.name).is.not.undefined
    expect(metaData?.symbol).is.not.undefined
    expect(metaData?.data).is.not.undefined

    return {
        name: String(metaData.name),
        symbol: String(metaData.symbol),
        data: String(metaData.data)
    }
}
