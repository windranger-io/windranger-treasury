// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    BitDAO,
    BondFactory,
    BondManager,
    BondMediator
} from '../typechain-types'
import {
    deployContract,
    deployContractWithProxy,
    signer
} from './framework/contracts'
import {BOND_ADMIN, BOND_AGGREGATOR} from './contracts/bond/roles'
import {successfulTransaction} from './framework/transaction'
import {addBondEventLogs} from './contracts/bond/bond-curator-events'
import {eventLog} from './framework/event-logs'
import {erc20SingleCollateralBondContractAt} from './contracts/bond/single-collateral-bond-contract'
import {constants} from 'ethers'
import {verifyOwnershipTransferredEventLogs} from './contracts/ownable/verify-ownable-event'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ExtendedERC20} from './contracts/cast/extended-erc20'
import {accessControlRevertMessage} from './contracts/bond/bond-access-control-messages'

// Wires up Waffle with Chai
chai.use(solidity)

describe('Bond Mediator contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        curator = await deployContractWithProxy<BondManager>('BondManager')
        creator = await deployContractWithProxy<BondFactory>(
            'BondFactory',
            collateralTokens.address,
            treasury
        )
        mediator = await deployContractWithProxy<BondMediator>(
            'BondMediator',
            creator.address,
            curator.address
        )

        await curator.grantRole(BOND_AGGREGATOR.hex, mediator.address)
    })

    describe('managed bond', () => {
        describe('create', () => {
            it('only bond admin', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .createManagedBond(
                            'Bond Name',
                            'Bond Symbol',
                            1n,
                            'Collateral Symbol',
                            0n,
                            100n,
                            ''
                        )
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, BOND_ADMIN)
                )
            })

            it('BIT collateralized', async () => {
                const bondName = 'A highly unique bond name'
                const bondSymbol = 'Bond Symbol'
                const debtTokens = 101n
                const collateralSymbol = 'BIT'
                const expiryTimestamp = 9999n
                const minimumDeposit = 1n
                const metaData = 'meh'

                const receipt = await successfulTransaction(
                    mediator.createManagedBond(
                        bondName,
                        bondSymbol,
                        debtTokens,
                        collateralSymbol,
                        expiryTimestamp,
                        minimumDeposit,
                        metaData
                    )
                )

                const addBondEvents = addBondEventLogs(
                    eventLog('AddBond', curator, receipt)
                )
                expect(addBondEvents.length).to.equal(1)

                const createdBondAddress = addBondEvents[0].bond
                expect(await curator.bondCount()).equals(1)
                expect(await curator.bondAt(0)).equals(createdBondAddress)

                const bond = await erc20SingleCollateralBondContractAt(
                    createdBondAddress
                )

                verifyOwnershipTransferredEventLogs(
                    [
                        {
                            previousOwner: constants.AddressZero,
                            newOwner: creator.address
                        },
                        {
                            previousOwner: creator.address,
                            newOwner: mediator.address
                        },
                        {
                            previousOwner: mediator.address,
                            newOwner: curator.address
                        }
                    ],
                    bond,
                    receipt
                )

                expect(await bond.name()).equals(bondName)
                expect(await bond.symbol()).equals(bondSymbol)
                expect(await bond.debtTokens()).equals(debtTokens)
                expect(await bond.collateralTokens()).equals(
                    collateralTokens.address
                )
                expect(await bond.expiryTimestamp()).equals(expiryTimestamp)
                expect(await bond.minimumDeposit()).equals(minimumDeposit)
                expect(await bond.metaData()).equals(metaData)
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                await expect(
                    mediator.createManagedBond(
                        'Bond Name',
                        'Bond Symbol',
                        1n,
                        'Collateral Symbol',
                        0n,
                        100n,
                        ''
                    )
                ).to.be.revertedWith('Pausable: paused')
            })
        })
    })

    describe('unpause', () => {
        it('changes state', async () => {
            await mediator.pause()

            expect(await mediator.paused()).is.true

            await mediator.unpause()

            expect(await mediator.paused()).is.false
        })

        it('only bond factory admin', async () => {
            await expect(mediator.connect(nonAdmin).pause()).to.be.revertedWith(
                'AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
            )
        })

        it('only when paused', async () => {
            await expect(mediator.unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })
    })

    let admin: string
    let treasury: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ExtendedERC20
    let mediator: BondMediator
    let curator: BondManager
    let creator: BondFactory
})
