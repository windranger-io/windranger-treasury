// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {DAO_ADMIN, SYSTEM_ADMIN} from './contracts/bond/roles'
import {before} from 'mocha'
import {deployContract, signer} from './framework/contracts'
import {BondAccessControlBox} from '../typechain-types'
import {solidity} from 'ethereum-waffle'

// Wires up Waffle with Chai
chai.use(solidity)

const DAO_ID = 1
const DAO_ADMIN_ROLE = DAO_ADMIN.hex
const SYS_ADMIN_ROLE = SYSTEM_ADMIN.hex

describe('Bond Access Control contract', () => {
    before(async () => {
        superUser = (await signer(0)).address
        memberOne = (await signer(3)).address
        memberTwo = (await signer(4)).address
        accessControl = await deployContract<BondAccessControlBox>(
            'BondAccessControlBox'
        )
    })

    describe('DAO Admin', () => {
        it('add member', async () => {
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    superUser
                )
            ).is.true
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne
                )
            ).is.false

            await accessControl.grantDaoAdminRole(DAO_ADMIN_ROLE, memberOne)

            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    superUser
                )
            ).is.true
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne
                )
            ).is.true
        })

        it('remove member', async () => {
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    superUser
                )
            ).is.true
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne
                )
            ).is.true

            await accessControl.revokeDaoAdminRole(DAO_ADMIN_ROLE, memberOne)

            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    superUser
                )
            ).is.true
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne
                )
            ).is.false
        })

        it('DAO Admin is the role admin', async () => {
            expect(
                await accessControl.allDaoRoleAdmins(DAO_ID, DAO_ADMIN_ROLE)
            ).equals(DAO_ADMIN_ROLE)
        })
    })

    describe('SysAdmin', () => {
        it('add member', async () => {
            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, superUser))
                .is.true
            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, memberTwo))
                .is.false

            await accessControl.grantDaoAdminRole(SYS_ADMIN_ROLE, memberTwo)

            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, superUser))
                .is.true
            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, memberTwo))
                .is.true
        })

        it('remove member', async () => {
            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, superUser))
                .is.true
            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, memberTwo))
                .is.true

            await accessControl.revokeDaoAdminRole(SYS_ADMIN_ROLE, memberTwo)

            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, superUser))
                .is.true
            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, memberTwo))
                .is.false
        })

        it('DAO Admin is the role admin', async () => {
            expect(
                await accessControl.allGlobalRoleAdmins(SYS_ADMIN_ROLE)
            ).equals(SYS_ADMIN_ROLE)
        })
    })

    let superUser: string
    let memberOne: string
    let memberTwo: string
    let accessControl: BondAccessControlBox
})
