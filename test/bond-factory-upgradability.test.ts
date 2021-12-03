// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
import '@openzeppelin/hardhat-upgrades'
// End - Support direct Mocha run & debug

import chaiAsPromised from 'chai-as-promised'
import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    BitDAO,
    BondFactory,
    BondFactoryWithInitialValueField,
    BondFactoryWithConstructor,
    BondFactoryWithImmutableField,
    ERC20,
    BondFactoryWithEnum,
    BondFactoryWithStruct,
    BondFactoryWithSelfDestruct
} from '../typechain'
import {
    deployContract,
    deployContractWithProxy,
    signer,
    upgradeContract
} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ethers} from 'hardhat'
import {
    upgradedEvent,
    UpgradedEventArgs
} from './contracts/upgradable/upgradable-events'
import {occurrenceAtMost} from './framework/time'
import {EventListener} from './framework/event-listener'

// Wires Chai with Waffle and Promises
chai.use(solidity)
chai.use(chaiAsPromised)

const MAXIMUM_WAIT_MS = 5000

describe('BondFactory contract', () => {
    before(async () => {
        admin = await signer(0)
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin.address)
    })

    beforeEach(async () => {
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
    })

    describe('upgrade', () => {
        it('extension contract', async () => {
            const beforeUpgradeAddress = bonds.address
            const startingTreasury = await bonds.treasury()
            expect(startingTreasury).equals(treasury)

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

        it('new struct is fine', async () => {
            return upgradeContract<BondFactoryWithStruct>(
                'BondFactoryWithStruct',
                bonds.address
            )
        })

        it('new enum is fine', async () => {
            return upgradeContract<BondFactoryWithEnum>(
                'BondFactoryWithEnum',
                bonds.address
            )
        })

        it('no constructor', async () => {
            await expect(
                upgradeContract<BondFactoryWithConstructor>(
                    'BondFactoryWithConstructor',
                    bonds.address
                )
            ).to.be.eventually.rejectedWith(
                'Contract `BondFactoryWithConstructor` has a constructor'
            )
        })

        it('no field with initial value', async () => {
            await expect(
                upgradeContract<BondFactoryWithInitialValueField>(
                    'BondFactoryWithInitialValueField',
                    bonds.address
                )
            ).to.be.eventually.rejectedWith(
                'Variable `_initiallyPopulated` is assigned an initial value'
            )
        })

        it('no immutable field', async () => {
            await expect(
                upgradeContract<BondFactoryWithImmutableField>(
                    'BondFactoryWithImmutableField',
                    bonds.address
                )
            ).to.be.eventually.rejectedWith(
                'Variable `_neverGoingToChange` is immutable'
            )
        })

        it('no self destruct', async () => {
            await expect(
                upgradeContract<BondFactoryWithSelfDestruct>(
                    'BondFactoryWithSelfDestruct',
                    bonds.address
                )
            ).to.be.eventually.rejectedWith(
                'Use of selfdestruct is not allowed'
            )
        })

        it('only owner', async () => {
            expect(await bonds.owner()).equals(admin.address)
            await bonds.transferOwnership(nonAdmin.address)
            expect(await bonds.owner()).equals(nonAdmin.address)

            // upgrades are fixed to use the first signer (owner) account
            await expect(
                upgradeContract<BondFactory>(
                    'BondFactoryExtension',
                    bonds.address
                )
            ).to.be.revertedWith(
                "reverted with reason string 'Ownable: caller is not the owner"
            )
        })
    })

    let admin: SignerWithAddress
    let treasury: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ERC20
    let bonds: BondFactory
    let upgradedListener: EventListener<UpgradedEventArgs>
})
