import {BaseContract, ContractReceipt} from 'ethers'
import {expect} from 'chai'
import {Result} from '@ethersproject/abi'

/**
 * Retrieves a single event log that matches the given name, failing if not present.
 *
 * @param name  name of the event expected within the given contracts.
 * @param decoder emitter contract that emits the event and provide decoding of the event log.
 * @param receipt expected to contain the events matching the given name.
 */
export function eventLog<T extends BaseContract>(
    name: string,
    emitter: T,
    receipt: ContractReceipt
): Result {
    const found = eventLogs(name, emitter, receipt)
    expect(found.length, 'Expecting a single EventLog entry').equals(1)
    return found[0]
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

    for (const log of receipt.logs) {
        if (emitter.address === log.address) {
            found.push(
                emitter.interface.decodeEventLog(
                    'AddBond',
                    log.data,
                    log.topics
                )
            )
        }
    }

    expect(
        found.length,
        'Failed to find any event matching name: ' + name
    ).is.greaterThan(0)

    return found
}
