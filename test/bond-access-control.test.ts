// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {
    BOND_ADMIN,
    BOND_AGGREGATOR,
    DAO_ADMIN,
    Role,
    SYSTEM_ADMIN
} from './contracts/bond/roles'
import {before} from 'mocha'
import {deployContract, signer} from './framework/contracts'
import {BondAccessControlBox} from '../typechain-types'
import {solidity} from 'ethereum-waffle'
import {ContractTransaction} from 'ethers'

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
            expect(await accessControl.hasRole(BOND_ADMIN.hex, memberOne)).is
                .false
            expect(await accessControl.hasRole(BOND_ADMIN.hex, admin)).is.true

            await accessControl.grantRole(BOND_ADMIN.hex, memberOne)

            expect(await accessControl.hasRole(BOND_ADMIN.hex, admin)).is.true
            expect(await accessControl.hasRole(BOND_ADMIN.hex, memberOne)).is
                .true
        })

        it('remove member', async () => {
            expect(await hasRole(BOND_ADMIN, admin)).is.true
            expect(await hasRole(BOND_ADMIN, memberOne)).is.true

            await revokeRole(BOND_ADMIN, memberOne)

            expect(await hasRole(BOND_ADMIN, admin)).is.true
            expect(await hasRole(BOND_ADMIN, memberOne)).is.false
        })

        it('DAO Admin is the role admin', async () => {
            expect(await getRoleAdmin(BOND_ADMIN)).equals(DAO_ADMIN.hex)
        })
    })

    describe('Bond Aggregator', () => {
        it('add member', async () => {
            expect(await hasRole(BOND_AGGREGATOR, memberOne)).is.false
            expect(await hasRole(BOND_AGGREGATOR, admin)).is.true

            await grantRole(BOND_AGGREGATOR, memberOne)

            expect(await hasRole(BOND_AGGREGATOR, admin)).is.true
            expect(await hasRole(BOND_AGGREGATOR, memberOne)).is.true
        })

        it('remove member', async () => {
            expect(await hasRole(BOND_AGGREGATOR, admin)).is.true
            expect(await hasRole(BOND_AGGREGATOR, memberOne)).is.true

            await revokeRole(BOND_AGGREGATOR, memberOne)

            expect(await hasRole(BOND_AGGREGATOR, admin)).is.true
            expect(await hasRole(BOND_AGGREGATOR, memberOne)).is.false
        })

        it('DAO Admin is the role admin', async () => {
            expect(await getRoleAdmin(BOND_AGGREGATOR)).equals(DAO_ADMIN.hex)
        })
    })

    describe('DAO Admin', () => {
        it('add member', async () => {
            expect(await hasRole(DAO_ADMIN, admin)).is.true
            expect(await hasRole(DAO_ADMIN, memberTwo)).is.false

            await grantRole(DAO_ADMIN, memberTwo)

            expect(await hasRole(DAO_ADMIN, admin)).is.true
            expect(await hasRole(DAO_ADMIN, memberTwo)).is.true
        })

        it('remove member', async () => {
            expect(await hasRole(DAO_ADMIN, admin)).is.true
            expect(await hasRole(DAO_ADMIN, memberTwo)).is.true

            await revokeRole(DAO_ADMIN, memberTwo)

            expect(await hasRole(DAO_ADMIN, admin)).is.true
            expect(await hasRole(DAO_ADMIN, memberTwo)).is.false
        })

        it('DAO Admin is the role admin', async () => {
            expect(await getRoleAdmin(DAO_ADMIN)).equals(DAO_ADMIN.hex)
        })
    })

    describe('SysAdmin', () => {
        it('add member', async () => {
            expect(await hasRole(SYSTEM_ADMIN, admin)).is.true
            expect(await hasRole(SYSTEM_ADMIN, memberThree)).is.false

            await grantRole(SYSTEM_ADMIN, memberThree)

            expect(await hasRole(SYSTEM_ADMIN, admin)).is.true
            expect(await hasRole(SYSTEM_ADMIN, memberThree)).is.true
        })

        it('remove member', async () => {
            expect(await hasRole(SYSTEM_ADMIN, admin)).is.true
            expect(await hasRole(SYSTEM_ADMIN, memberThree)).is.true

            await revokeRole(SYSTEM_ADMIN, memberThree)

            expect(await hasRole(SYSTEM_ADMIN, admin)).is.true
            expect(await hasRole(SYSTEM_ADMIN, memberThree)).is.false
        })

        it('DAO Admin is the role admin', async () => {
            expect(await getRoleAdmin(SYSTEM_ADMIN)).equals(DAO_ADMIN.hex)
        })
    })

    async function grantRole(
        grant: Role,
        address: string
    ): Promise<ContractTransaction> {
        return accessControl.grantRole(grant.hex, address)
    }

    async function revokeRole(
        revoke: Role,
        address: string
    ): Promise<ContractTransaction> {
        return accessControl.revokeRole(revoke.hex, address)
    }

    async function getRoleAdmin(queryingAdmin: Role): Promise<string> {
        return accessControl.getRoleAdmin(queryingAdmin.hex)
    }

    async function hasRole(expected: Role, address: string): Promise<boolean> {
        return accessControl.hasRole(expected.hex, address)
    }

    let admin: string
    let memberOne: string
    let memberTwo: string
    let memberThree: string
    let accessControl: BondAccessControlBox
})
