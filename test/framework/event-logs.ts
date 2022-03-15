import {BaseContract, ContractReceipt, utils} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'

/**
 * Retrieves the event logs that matches the given name, failing if not present.
 *
 * @param name  name of the event expected within the given contracts.
 * @param decoder emitter contract that emits the event and provide decoding of the event log.
 * @param receipt events matching the given event name.
 */
export function eventLog<T extends BaseContract>(
    name: string,
    emitter: T,
    receipt: ContractReceipt
): Result[] {
    const found = eventLogs(name, emitter, receipt)
    expect(
        found.length,
        'Expecting at least a single EventLog entry'
    ).is.greaterThanOrEqual(1)
    return found
}

/**
 * Retrieves all events that matches the given name, failing if not present.
 *
 * @param name  name of the event expected within the given contracts.
 * @param decoder emitter contract that emits the event and provide decoding of the event log.
 * @param receipt expected to contain the events matching the given name.
 */
function eventLogs<T extends BaseContract>(
    name: string,
    emitter: T,
    receipt: ContractReceipt
): Result[] {
    const found: Result[] = []

    const eventId = utils.id(emitter.interface.getEvent(name).format())

    for (const log of receipt.logs) {
        if (
            emitter.address.toLowerCase() === log.address.toLowerCase() &&
            eventId === log.topics[0]
        ) {
            found.push(
                emitter.interface.decodeEventLog(name, log.data, log.topics)
            )
        }
    }

    expect(
        found.length,
        'Failed to find any event matching name: ' + name
    ).is.greaterThan(0)

    return found
}
