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
    ERC20,
    ERC20SingleCollateralBond
} from '../typechain'
import {
    deployContract,
    deployContractWithProxy,
    execute,
    signer
} from './framework/contracts'
import {
    BOND_ADMIN_ROLE,
    BOND_AGGREGATOR_ROLE,
    DAO_ADMIN_ROLE,
    SYSTEM_ADMIN_ROLE
} from './contracts/roles'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {constants} from 'ethers'
import {successfulTransaction} from './framework/transaction'
import {erc20SingleCollateralBondContractAt} from './contracts/bond/single-collateral-bond-contract'
import {createBondEvent} from './contracts/bond/bond-factory-events'
import {event} from './framework/events'
import {
    verifyAddBondEvents,
    verifyAddBondLogEvents
} from './contracts/bond/verify-manager-events'

// Wires up Waffle with Chai
chai.use(solidity)

describe('Bond Manager contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        memberOne = (await signer(2)).address
        memberTwo = (await signer(3)).address
        memberThree = (await signer(4)).address
        nonAggregator = await signer(5)
        curator = await deployContractWithProxy<BondManager>('BondManager')
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        collateralSymbol = await collateralTokens.symbol()
        creator = await deployContractWithProxy<BondFactory>(
            'BondFactory',
            collateralTokens.address,
            admin
        )
    })

    describe('access control', () => {
        describe('Bond Admin', () => {
            it('add member', async () => {
                expect(await curator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .false
                expect(await curator.hasRole(BOND_ADMIN_ROLE, admin)).is.true

                await curator.grantRole(BOND_ADMIN_ROLE, memberOne)

                expect(await curator.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await curator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .true
            })

            it('remove member', async () => {
                expect(await curator.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await curator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .true

                await curator.revokeRole(BOND_ADMIN_ROLE, memberOne)

                expect(await curator.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await curator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .false
            })

            it('DAO Admin is the role admin', async () => {
                expect(await curator.getRoleAdmin(BOND_ADMIN_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })

        describe('Bond Aggregator', () => {
            it('add member', async () => {
                expect(await curator.hasRole(BOND_AGGREGATOR_ROLE, memberOne))
                    .is.false
                expect(await curator.hasRole(BOND_AGGREGATOR_ROLE, admin)).is
                    .true

                await curator.grantRole(BOND_AGGREGATOR_ROLE, memberOne)

                expect(await curator.hasRole(BOND_AGGREGATOR_ROLE, admin)).is
                    .true
                expect(await curator.hasRole(BOND_AGGREGATOR_ROLE, memberOne))
                    .is.true
            })

            it('remove member', async () => {
                expect(await curator.hasRole(BOND_AGGREGATOR_ROLE, admin)).is
                    .true
                expect(await curator.hasRole(BOND_AGGREGATOR_ROLE, memberOne))
                    .is.true

                await curator.revokeRole(BOND_AGGREGATOR_ROLE, memberOne)

                expect(await curator.hasRole(BOND_AGGREGATOR_ROLE, admin)).is
                    .true
                expect(await curator.hasRole(BOND_AGGREGATOR_ROLE, memberOne))
                    .is.false
            })

            it('DAO Admin is the role admin', async () => {
                expect(await curator.getRoleAdmin(BOND_AGGREGATOR_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })

        describe('DAO Admin', () => {
            it('add member', async () => {
                expect(await curator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await curator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                    .false

                await curator.grantRole(DAO_ADMIN_ROLE, memberTwo)

                expect(await curator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await curator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is.true
            })

            it('remove member', async () => {
                expect(await curator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await curator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is.true

                await curator.revokeRole(DAO_ADMIN_ROLE, memberTwo)

                expect(await curator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await curator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                    .false
            })

            it('DAO Admin is the role admin', async () => {
                expect(await curator.getRoleAdmin(DAO_ADMIN_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })

        describe('SysAdmin', () => {
            it('add member', async () => {
                expect(await curator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await curator.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is
                    .false

                await curator.grantRole(SYSTEM_ADMIN_ROLE, memberThree)

                expect(await curator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await curator.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is
                    .true
            })

            it('remove member', async () => {
                expect(await curator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await curator.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is
                    .true

                await curator.revokeRole(SYSTEM_ADMIN_ROLE, memberThree)

                expect(await curator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await curator.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is
                    .false
            })

            it('DAO Admin is the role admin', async () => {
                expect(await curator.getRoleAdmin(SYSTEM_ADMIN_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })
    })

    describe('add bond', () => {
        it('only Bond Aggregator', async () => {
            await expect(
                curator.connect(nonAggregator).addBond(constants.AddressZero)
            ).to.be.revertedWith(
                'AccessControl: account 0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc is missing role 0x424f4e445f41474752454741544f520000000000000000000000000000000000'
            )
        })

        it('not already managing', async () => {
            const bond = await createBond()
            await successfulTransaction(curator.addBond(bond.address))

            await expect(curator.addBond(bond.address)).to.be.revertedWith(
                'BondManager: already managing'
            )
        })

        it('is the owner', async () => {
            const bond = await createBondWithOwner(admin)

            await expect(curator.addBond(bond.address)).to.be.revertedWith(
                'BondManager: not bond owner'
            )
        })

        it('when valid', async () => {
            const bond = await createBond()

            const receipt = await successfulTransaction(
                curator.addBond(bond.address)
            )
            const createdBondIndex = await curator.bondCount()
            expect(await curator.bondAt(createdBondIndex.sub(1n))).equals(
                bond.address
            )
            const expectedAddBondEvents = [{bond: bond.address}]
            verifyAddBondLogEvents(curator, receipt, expectedAddBondEvents)
            verifyAddBondEvents(receipt, expectedAddBondEvents)
        })
    })

    // TODO For all test: roles, is managing bond and bond state affect

    // TODO bondAllowRedemption

    // TODO bondDeposit

    // TODO bondPause

    // TODO bondSlash

    // TODO bondSetMetaData

    // TODO bondSetTreasury

    // TODO bondUnpause

    // TODO bondWithdrawCollateral

    // TODO pause

    // TODO unpause

    async function createBond(): Promise<ERC20SingleCollateralBond> {
        return createBondWithOwner(curator.address)
    }

    async function createBondWithOwner(
        owner: string
    ): Promise<ERC20SingleCollateralBond> {
        const receipt = await execute(
            creator.createBond(
                'name',
                'symbol',
                100n,
                collateralSymbol,
                0n,
                1n,
                ''
            )
        )

        const creationEvent = createBondEvent(event('CreateBond', receipt))
        const bond = await erc20SingleCollateralBondContractAt(
            creationEvent.bond
        )
        await bond.transferOwnership(owner)

        return bond
    }

    let admin: string
    let memberOne: string
    let memberTwo: string
    let memberThree: string
    let nonAggregator: SignerWithAddress
    let curator: BondManager
    let collateralTokens: ERC20
    let collateralSymbol: string
    let creator: BondFactory
})
