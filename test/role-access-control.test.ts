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
import {accessControlRevertMessageAlreadyRoleMember} from './contracts/bond/access-control-messages'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'

// Wires up Waffle with Chai
chai.use(solidity)

const DAO_ID = 1
const OTHER_DAO_ID = 2
const DAO_ADMIN_ROLE = DAO_ADMIN.hex
const SYS_ADMIN_ROLE = SYSTEM_ADMIN.hex

describe('Role Access Control contract', () => {
    before(async () => {
        memberOneSigner = await signer(1)
        memberOne = memberOneSigner.address
        memberTwo = (await signer(2)).address
        accessControl = await deployContract<BondAccessControlBox>(
            'BondAccessControlBox'
        )
    })

    /*
     * TODO tiering SU > DA > DM - isa
     * TODO missing role
     * TODO missing permissions
     * TODO custom messages when grant roles fail
     */

    describe('DAO Admin', () => {
        it('add member', async () => {
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne
                )
            ).is.false

            await accessControl.grantDaoAdminRole(DAO_ID, memberOne)

            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne
                )
            ).is.true
        })

        it('scoped to dao id', async () => {
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne
                )
            ).is.true

            expect(
                await accessControl.hasDaoRole(
                    OTHER_DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne
                )
            ).is.false
        })

        it('cannot grant twice', async () => {
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne
                )
            ).is.true

            await expect(
                accessControl.grantDaoAdminRole(DAO_ID, memberOne)
            ).to.be.revertedWith(
                accessControlRevertMessageAlreadyRoleMember(
                    memberOneSigner,
                    DAO_ADMIN
                )
            )
        })

        it('remove member', async () => {
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne
                )
            ).is.true

            await accessControl.revokeDaoAdminRole(DAO_ID, memberOne)

            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne
                )
            ).is.false
        })
    })

    describe('Sys Admin', () => {
        it('add member', async () => {
            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, memberTwo))
                .is.false

            await accessControl.grantSysAdminRole(memberTwo)

            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, memberTwo))
                .is.true
        })

        it('remove member', async () => {
            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, memberTwo))
                .is.true

            await accessControl.revokeSysAdminRole(memberTwo)

            expect(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, memberTwo))
                .is.false
        })
    })

    let memberOne: string
    let memberOneSigner: SignerWithAddress
    let memberTwo: string
    let accessControl: BondAccessControlBox
})
