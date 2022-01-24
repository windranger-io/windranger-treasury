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
    BondMediator,
    ERC20
} from '../typechain'
import {
    deployContract,
    deployContractWithProxy,
    signer
} from './framework/contracts'
import {
    BOND_ADMIN_ROLE,
    BOND_AGGREGATOR_ROLE,
    DAO_ADMIN_ROLE,
    SYSTEM_ADMIN_ROLE
} from './contracts/roles'
import {successfulTransaction} from './framework/transaction'
import {addBondEventLogs} from './contracts/bond/bond-manager-events'
import {eventLog} from './framework/event-logs'
import {erc20SingleCollateralBondContractAt} from './contracts/bond/single-collateral-bond-contract'
import {constants} from 'ethers'
import {verifyOwnershipTransferredEventLogs} from './contracts/ownable/verify-ownable-event'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'

// Wires up Waffle with Chai
chai.use(solidity)

describe('Bond Mediator contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        memberOne = (await signer(2)).address
        memberTwo = (await signer(3)).address
        memberThree = (await signer(4)).address
        nonAdmin = await signer(5)
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

        await curator.grantRole(BOND_AGGREGATOR_ROLE, mediator.address)
    })

    describe('Access control', () => {
        describe('Bond Admin', () => {
            it('add member', async () => {
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .false
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, admin)).is.true

                await mediator.grantRole(BOND_ADMIN_ROLE, memberOne)

                expect(await mediator.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .true
            })

            it('remove member', async () => {
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .true

                await mediator.revokeRole(BOND_ADMIN_ROLE, memberOne)

                expect(await mediator.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .false
            })

            it('DAO Admin is the role admin', async () => {
                expect(await mediator.getRoleAdmin(BOND_ADMIN_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })

        describe('DAO Admin', () => {
            it('add member', async () => {
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                    .false

                await mediator.grantRole(DAO_ADMIN_ROLE, memberTwo)

                expect(await mediator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                    .true
            })

            it('remove member', async () => {
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                    .true

                await mediator.revokeRole(DAO_ADMIN_ROLE, memberTwo)

                expect(await mediator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                    .false
            })

            it('DAO Admin is the role admin', async () => {
                expect(await mediator.getRoleAdmin(DAO_ADMIN_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })

        describe('SysAdmin', () => {
            it('add member', async () => {
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                    .is.false

                await mediator.grantRole(SYSTEM_ADMIN_ROLE, memberThree)

                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                    .is.true
            })

            it('remove member', async () => {
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                    .is.true

                await mediator.revokeRole(SYSTEM_ADMIN_ROLE, admin)

                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is
                    .false
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                    .is.true
            })

            it('DAO Admin is the role admin', async () => {
                expect(await mediator.getRoleAdmin(SYSTEM_ADMIN_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })
    })

    describe('Managed bond', () => {
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
                    'AccessControl: account ' +
                        nonAdmin.address.toLowerCase() +
                        ' is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
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
        })
    })

    let admin: string
    let treasury: string
    let memberOne: string
    let memberTwo: string
    let memberThree: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ERC20
    let mediator: BondMediator
    let curator: BondManager
    let creator: BondFactory
})
