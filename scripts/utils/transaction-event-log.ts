import {ContractReceipt, Event} from 'ethers'
import {createPerformanceBondEventLogs} from '../../test/event/performance-bonds/performance-bond-creator-events'
import {eventLog} from '../../test/framework/event-logs'
import {log} from '../../config/logging'
import {PerformanceBondFactory, StakingPoolFactory} from '../../typechain-types'
import {stakingPoolCreatedEventLogs} from '../../test/event/staking/staking-factory-events'

function receiptEvents(receipt: ContractReceipt): Event[] {
    const availableEvents = receipt.events
    return availableEvents ? availableEvents : []
}

export function logEvents(receipt: ContractReceipt): void {
    const events = receiptEvents(receipt)

    for (const event of events) {
        log.info('%s, %s', event.event, JSON.stringify(event.args))
    }
}

export function logCreateBondEvents(
    emitter: PerformanceBondFactory,
    receipt: ContractReceipt
): void {
    const createBondEvents = createPerformanceBondEventLogs(
        eventLog('CreatePerformanceBond', emitter, receipt)
    )

    for (const event of createBondEvents) {
        log.info('CreateBond event: %s', JSON.stringify(event))
    }
}

export function logCreateStakingPoolEvents(
    emitter: StakingPoolFactory,
    receipt: ContractReceipt
): void {
    const createBondEvents = stakingPoolCreatedEventLogs(
        eventLog('CreateStakingPool', emitter, receipt)
    )

    for (const event of createBondEvents) {
        log.info('CreateBond event: %s', JSON.stringify(event))
    }
}
