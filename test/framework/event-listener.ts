import {BaseContract, Contract, Event} from 'ethers'
import {expect} from 'chai'

/**
 * Converts the unvalidated event, into a typed version, verifying the shape.
 */
export interface EventConverter<T> {
    (parameters: Event): T
}

/**
 * Listeners for a single type of contract event.
 */
export class EventListener<T> {
    _events: T[] = []

    constructor(
        contract: BaseContract,
        eventName: string,
        convert: EventConverter<T>
    ) {
        captureEvents(contract, eventName, (event) => {
            this._events.push(convert(event))
        })
    }

    public events(): T[] {
        return this._events
    }
}

interface EventReceived {
    (parameters: Event): void
}

function captureEvents(
    contract: Contract,
    eventName: string,
    react: EventReceived
): void {
    contract.on(eventName, (...args: Array<unknown>) => {
        expect(
            args.length,
            'The event details are missing'
        ).is.greaterThanOrEqual(1)

        /*
         * Array is organised with each parameter being an entry,
         * last entry being the entire transaction receipt.
         */
        const lastEntry = args.length - 1
        const event = args[lastEntry] as Event

        expect(event.blockNumber, 'The event should have a block number').is.not
            .undefined

        react(event)
    })
}
