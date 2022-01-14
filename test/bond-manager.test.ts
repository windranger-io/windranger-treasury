// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BondManager} from '../typechain'
import {deployContractWithProxy, signer} from './framework/contracts'
import {
    BOND_ADMIN_ROLE,
    BOND_AGGREGATOR_ROLE,
    DAO_ADMIN_ROLE,
    SYSTEM_ADMIN_ROLE
} from './contracts/roles'

// Wires up Waffle with Chai
chai.use(solidity)

describe('Bond Manager contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        memberOne = (await signer(2)).address
        memberTwo = (await signer(3)).address
        memberThree = (await signer(4)).address
        bonds = await deployContractWithProxy<BondManager>('BondManager')
    })

    describe('Access control', () => {
        describe('Bond Admin', () => {
            it('add member', async () => {
                expect(await bonds.hasRole(BOND_ADMIN_ROLE, memberOne)).is.false
                expect(await bonds.hasRole(BOND_ADMIN_ROLE, admin)).is.true

                await bonds.grantRole(BOND_ADMIN_ROLE, memberOne)

                expect(await bonds.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await bonds.hasRole(BOND_ADMIN_ROLE, memberOne)).is.true
            })

            it('remove member', async () => {
                expect(await bonds.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await bonds.hasRole(BOND_ADMIN_ROLE, memberOne)).is.true

                await bonds.revokeRole(BOND_ADMIN_ROLE, memberOne)

                expect(await bonds.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await bonds.hasRole(BOND_ADMIN_ROLE, memberOne)).is.false
            })

            it('DAO Admin is the role admin', async () => {
                expect(await bonds.getRoleAdmin(BOND_ADMIN_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })

        describe('Bond Aggregator', () => {
            it('add member', async () => {
                expect(await bonds.hasRole(BOND_AGGREGATOR_ROLE, memberOne)).is
                    .false
                expect(await bonds.hasRole(BOND_AGGREGATOR_ROLE, admin)).is.true

                await bonds.grantRole(BOND_AGGREGATOR_ROLE, memberOne)

                expect(await bonds.hasRole(BOND_AGGREGATOR_ROLE, admin)).is.true
                expect(await bonds.hasRole(BOND_AGGREGATOR_ROLE, memberOne)).is
                    .true
            })

            it('remove member', async () => {
                expect(await bonds.hasRole(BOND_AGGREGATOR_ROLE, admin)).is.true
                expect(await bonds.hasRole(BOND_AGGREGATOR_ROLE, memberOne)).is
                    .true

                await bonds.revokeRole(BOND_AGGREGATOR_ROLE, admin)

                expect(await bonds.hasRole(BOND_AGGREGATOR_ROLE, admin)).is
                    .false
                expect(await bonds.hasRole(BOND_AGGREGATOR_ROLE, memberOne)).is
                    .true
            })

            it('DAO Admin is the role admin', async () => {
                expect(await bonds.getRoleAdmin(BOND_AGGREGATOR_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })

        describe('DAO Admin', () => {
            it('add member', async () => {
                expect(await bonds.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await bonds.hasRole(DAO_ADMIN_ROLE, memberTwo)).is.false

                await bonds.grantRole(DAO_ADMIN_ROLE, memberTwo)

                expect(await bonds.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await bonds.hasRole(DAO_ADMIN_ROLE, memberTwo)).is.true
            })

            it('remove member', async () => {
                expect(await bonds.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await bonds.hasRole(DAO_ADMIN_ROLE, memberTwo)).is.true

                await bonds.revokeRole(DAO_ADMIN_ROLE, memberTwo)

                expect(await bonds.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await bonds.hasRole(DAO_ADMIN_ROLE, memberTwo)).is.false
            })

            it('DAO Admin is the role admin', async () => {
                expect(await bonds.getRoleAdmin(DAO_ADMIN_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })

        describe('SysAdmin', () => {
            it('add member', async () => {
                expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is
                    .false

                await bonds.grantRole(SYSTEM_ADMIN_ROLE, memberThree)

                expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is
                    .true
            })

            it('remove member', async () => {
                expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is
                    .true

                await bonds.revokeRole(SYSTEM_ADMIN_ROLE, admin)

                expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.false
                expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is
                    .true
            })

            it('DAO Admin is the role admin', async () => {
                expect(await bonds.getRoleAdmin(SYSTEM_ADMIN_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })
    })

    let admin: string
    let memberOne: string
    let memberTwo: string
    let memberThree: string
    let bonds: BondManager
})
