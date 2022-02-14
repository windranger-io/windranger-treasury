// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {
    BOND_ADMIN_ROLE,
    BOND_AGGREGATOR_ROLE,
    DAO_ADMIN_ROLE,
    SYSTEM_ADMIN_ROLE
} from './contracts/roles'
import {before} from 'mocha'
import {deployContract, signer} from './framework/contracts'
import {BondAccessControlBox} from '../typechain-types'
import {solidity} from 'ethereum-waffle'

// Wires up Waffle with Chai
chai.use(solidity)

describe('Bond Access Control contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        memberOne = (await signer(3)).address
        memberTwo = (await signer(4)).address
        memberThree = (await signer(5)).address
        accessControl = await deployContract<BondAccessControlBox>(
            'BondAccessControlBox'
        )
    })

    describe('Bond Admin', () => {
        it('add member', async () => {
            expect(await accessControl.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                .false
            expect(await accessControl.hasRole(BOND_ADMIN_ROLE, admin)).is.true

            await accessControl.grantRole(BOND_ADMIN_ROLE, memberOne)

            expect(await accessControl.hasRole(BOND_ADMIN_ROLE, admin)).is.true
            expect(await accessControl.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                .true
        })

        it('remove member', async () => {
            expect(await accessControl.hasRole(BOND_ADMIN_ROLE, admin)).is.true
            expect(await accessControl.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                .true

            await accessControl.revokeRole(BOND_ADMIN_ROLE, memberOne)

            expect(await accessControl.hasRole(BOND_ADMIN_ROLE, admin)).is.true
            expect(await accessControl.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                .false
        })

        it('DAO Admin is the role admin', async () => {
            expect(await accessControl.getRoleAdmin(BOND_ADMIN_ROLE)).equals(
                DAO_ADMIN_ROLE
            )
        })
    })

    describe('Bond Aggregator', () => {
        it('add member', async () => {
            expect(await accessControl.hasRole(BOND_AGGREGATOR_ROLE, memberOne))
                .is.false
            expect(await accessControl.hasRole(BOND_AGGREGATOR_ROLE, admin)).is
                .true

            await accessControl.grantRole(BOND_AGGREGATOR_ROLE, memberOne)

            expect(await accessControl.hasRole(BOND_AGGREGATOR_ROLE, admin)).is
                .true
            expect(await accessControl.hasRole(BOND_AGGREGATOR_ROLE, memberOne))
                .is.true
        })

        it('remove member', async () => {
            expect(await accessControl.hasRole(BOND_AGGREGATOR_ROLE, admin)).is
                .true
            expect(await accessControl.hasRole(BOND_AGGREGATOR_ROLE, memberOne))
                .is.true

            await accessControl.revokeRole(BOND_AGGREGATOR_ROLE, memberOne)

            expect(await accessControl.hasRole(BOND_AGGREGATOR_ROLE, admin)).is
                .true
            expect(await accessControl.hasRole(BOND_AGGREGATOR_ROLE, memberOne))
                .is.false
        })

        it('DAO Admin is the role admin', async () => {
            expect(
                await accessControl.getRoleAdmin(BOND_AGGREGATOR_ROLE)
            ).equals(DAO_ADMIN_ROLE)
        })
    })

    describe('DAO Admin', () => {
        it('add member', async () => {
            expect(await accessControl.hasRole(DAO_ADMIN_ROLE, admin)).is.true
            expect(await accessControl.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                .false

            await accessControl.grantRole(DAO_ADMIN_ROLE, memberTwo)

            expect(await accessControl.hasRole(DAO_ADMIN_ROLE, admin)).is.true
            expect(await accessControl.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                .true
        })

        it('remove member', async () => {
            expect(await accessControl.hasRole(DAO_ADMIN_ROLE, admin)).is.true
            expect(await accessControl.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                .true

            await accessControl.revokeRole(DAO_ADMIN_ROLE, memberTwo)

            expect(await accessControl.hasRole(DAO_ADMIN_ROLE, admin)).is.true
            expect(await accessControl.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                .false
        })

        it('DAO Admin is the role admin', async () => {
            expect(await accessControl.getRoleAdmin(DAO_ADMIN_ROLE)).equals(
                DAO_ADMIN_ROLE
            )
        })
    })

    describe('SysAdmin', () => {
        it('add member', async () => {
            expect(await accessControl.hasRole(SYSTEM_ADMIN_ROLE, admin)).is
                .true
            expect(await accessControl.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                .is.false

            await accessControl.grantRole(SYSTEM_ADMIN_ROLE, memberThree)

            expect(await accessControl.hasRole(SYSTEM_ADMIN_ROLE, admin)).is
                .true
            expect(await accessControl.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                .is.true
        })

        it('remove member', async () => {
            expect(await accessControl.hasRole(SYSTEM_ADMIN_ROLE, admin)).is
                .true
            expect(await accessControl.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                .is.true

            await accessControl.revokeRole(SYSTEM_ADMIN_ROLE, memberThree)

            expect(await accessControl.hasRole(SYSTEM_ADMIN_ROLE, admin)).is
                .true
            expect(await accessControl.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                .is.false
        })

        it('DAO Admin is the role admin', async () => {
            expect(await accessControl.getRoleAdmin(SYSTEM_ADMIN_ROLE)).equals(
                DAO_ADMIN_ROLE
            )
        })
    })

    let admin: string
    let memberOne: string
    let memberTwo: string
    let memberThree: string
    let accessControl: BondAccessControlBox
})
