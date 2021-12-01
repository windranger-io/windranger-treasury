// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
import '@openzeppelin/hardhat-upgrades'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BitDAO, BondFactory, ERC20} from '../typechain'
import {
    deployContract,
    deployContractWithProxy,
    signer,
    upgradeContract
} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ethers, upgrades} from 'hardhat'
import {
    upgradedEvent,
    UpgradedEventArgs
} from './contracts/upgradable/upgradable-events'
import {occurrenceAtMost} from './framework/time'
import {EventListener} from './framework/event-listener'

// Wires up Waffle with Chai
chai.use(solidity)

const MAXIMUM_WAIT_MS = 5000

describe('BondFactory contract', () => {
    before(async () => {
        admin = await signer(0)
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin.address)
        collateralSymbol = await collateralTokens.symbol()
        bonds = await deployContractWithProxy<BondFactory>(
            'BondFactory',
            collateralTokens.address,
            treasury
        )
        upgradedListener = new EventListener<UpgradedEventArgs>(
            bonds,
            'Upgraded',
            (event) => upgradedEvent(event)
        )
        await occurrenceAtMost(
            () => upgradedListener.events().length == 1,
            MAXIMUM_WAIT_MS
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

    describe('upgrades', () => {
        //TODO test - happy path, upgrade
        //TODO test - invalid upgrade, no public upgradeTo
        //TODO test - invalid upgrade, no init
        //TODO transfer proxy admin ownership
        //TODO test only owner upgradable

        it('to an extending contract', async () => {
            const beforeUpgradeAddress = bonds.address
            const startingTreasury = await bonds.treasury()
            expect(startingTreasury).equals(treasury)

            expect(upgradedListener.events().length).equals(1)

            const upgradedBonds = await upgradeContract<BondFactory>(
                'BondFactoryExtension',
                bonds.address
            )

            await occurrenceAtMost(
                () => upgradedListener.events().length == 2,
                MAXIMUM_WAIT_MS
            )

            const upgradeEvents = upgradedListener.events()
            expect(upgradeEvents.length).equals(2)
            expect(upgradedBonds.address).equals(beforeUpgradeAddress)
            expect(ethers.utils.isAddress(upgradeEvents[0].implementation)).is
                .true
            expect(ethers.utils.isAddress(upgradeEvents[1].implementation)).is
                .true
            expect(upgradeEvents[0].implementation).does.not.equal(
                upgradeEvents[1].implementation
            )
        })
    })

    let admin: SignerWithAddress
    let treasury: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ERC20
    let collateralSymbol: string
    let bonds: BondFactory
    let upgradedListener: EventListener<UpgradedEventArgs>
})
