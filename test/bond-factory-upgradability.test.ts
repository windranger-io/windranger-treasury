// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
import '@openzeppelin/hardhat-upgrades'
// End - Support direct Mocha run & debug

import chai, {assert, expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BitDAO, BondFactory, ERC20} from '../typechain'
import {
    deployContract,
    deployProxyContract,
    signer
} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ethers, upgrades} from 'hardhat'
import {Contract, Event} from 'ethers'
import {upgradedEvent} from './contracts/upgradable/upgradable-events'
import {delayUntil} from './framework/time'

// Wires up Waffle with Chai
chai.use(solidity)

describe('BondFactory contract', () => {
    before(async () => {
        admin = await signer(0)
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin.address)
        collateralSymbol = await collateralTokens.symbol()

        bonds = await deployProxyContract<BondFactory>(
            'BondFactory',
            collateralTokens.address,
            treasury
        )
    })

    /*
    state-variable-assignment
    state-variable-immutable
    external-library-linking
    struct-definition
    enum-definition
    constructor
    delegatecall
    selfdestruct
    missing-public-upgradeto
*/

    //TODO events emitted for upgraded & admin changed

    // Upgraded(implementation)
    //
    // AdminChanged(previousAdmin, newAdmin)
    //
    // BeaconUpgraded(beacon)

    describe('upgrade', () => {
        //TODO test - happy path, upgrade
        //TODO test - invalid upgrade, no public upgradeTo
        //TODO test - invalid upgrade, no init
        //TODO transfer proxy admin ownership
        //TODO test only owner upgradable

        it('carries storage across', async () => {
            const beforeBlockNumber = await bockNumber()
            const beforeUpgrade = bonds
            const startingTreasury = await bonds.treasury()
            const upgradedEvents: {implementation: string}[] = []
            captureEvents(bonds, 'Upgraded', beforeBlockNumber, (event) => {
                upgradedEvents.push(upgradedEvent(event))
            })
            expect(startingTreasury).equals(treasury)

            const afterUpgrade = <BondFactory>(
                await upgrades.upgradeProxy(
                    bonds.address,
                    await ethers.getContractFactory('BondFactory')
                )
            )

            expect(beforeUpgrade.address).equals(afterUpgrade.address)
            expect(await afterUpgrade.treasury()).equals(treasury)

            await delayUntil(() => upgradedEvents.length == 1, 4000)

            expect(upgradedEvents.length).equals(1)

            await upgrades.upgradeProxy(
                bonds.address,
                await ethers.getContractFactory('BondFactoryTwo')
            )

            await delayUntil(() => upgradedEvents.length == 2, 4000)

            expect(upgradedEvents.length).equals(2)
            expect(ethers.utils.isAddress(upgradedEvents[0].implementation)).is
                .true
            expect(ethers.utils.isAddress(upgradedEvents[1].implementation)).is
                .true
            expect(upgradedEvents[0].implementation).does.not.equal(
                upgradedEvents[1].implementation
            )
        })
    })

    async function bockNumber(): Promise<number> {
        if (admin.provider == undefined) {
            assert.fail(
                'No provider found to retrieve block number from on admin'
            )
        } else {
            return admin.provider.getBlockNumber()
        }
    }

    let admin: SignerWithAddress
    let treasury: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ERC20
    let collateralSymbol: string
    let bonds: BondFactory
})

//TODO move elsewhere - generic helpers
interface EventReceived {
    (parameters: Event): void
}

function captureEvents(
    contract: Contract,
    eventName: string,
    exclusiveStartBlock: number,
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

        /*
         * Events stream from the beginning of time.
         * Ignore those before the block we begin being interested.
         */
        if (event.blockNumber > exclusiveStartBlock) {
            react(event)
        }
    })
}
