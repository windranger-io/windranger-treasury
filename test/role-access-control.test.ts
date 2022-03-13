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
import {
    accessControlRevertMessageAlreadyRoleMember,
    accessControlRevertMessageMissingDaoRole
} from './contracts/bond/access-control-messages'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'

// Wires up Waffle with Chai
chai.use(solidity)

const DAO_ID = 1
const OTHER_DAO_ID = 2
const DAO_ADMIN_ROLE = DAO_ADMIN.hex
const SYS_ADMIN_ROLE = SYSTEM_ADMIN.hex

describe('Role Access Control contract', () => {
    before(async () => {
        superUser = await signer(1)
        sysAdmin = await signer(2)
        daoCreator = await signer(3)
        daoAdmin = await signer(4)
        daoMeeple = await signer(5)

        memberOne = await signer(7)
        memberTwo = await signer(8)
        memberThree = await signer(9)

        accessControl = await deployContract<BondAccessControlBox>(
            'BondAccessControlBox'
        )

        await successfulTransaction(
            accessControl.grantSuperUserRole(superUser.address)
        )
        await successfulTransaction(
            accessControl.grantSysAdminRole(sysAdmin.address)
        )
        await successfulTransaction(
            accessControl.grantDaoCreatorRole(daoCreator.address)
        )
        await successfulTransaction(
            accessControl.grantDaoAdminRole(DAO_ID, daoAdmin.address)
        )
        await successfulTransaction(
            accessControl.grantDaoMeepleRole(DAO_ID, daoMeeple.address)
        )
    })

    /*
     *describe('Hierarchy', () => {
     *    describe('Super User', async () => {
     *        it('is a Super User', async () => {
     *            // TODO code
     *        })
     *        it('is a Dao Creator', async () => {
     *            // TODO code
     *        })
     *        it('is a System Admin', async () => {
     *            // TODO code
     *        })
     *        it('is a Dao Admin', async () => {
     *            // TODO code
     *        })
     *        it('is a Dao Meeple', async () => {
     *            // TODO code
     *        })
     *    })
     *
     *    describe('Dao Creator', async () => {
     *        it('is not a Super User', async () => {
     *            // TODO code
     *        })
     *        it('is a Dao Creator', async () => {
     *            // TODO code
     *        })
     *        it('is not a System Admin', async () => {
     *            // TODO code
     *        })
     *        it('is not a Dao Admin', async () => {
     *            // TODO code
     *        })
     *        it('is not a Dao Meeple', async () => {
     *            // TODO code
     *        })
     *    })
     *
     *    describe('System Admin', async () => {
     *        it('is not a Super User', async () => {
     *            // TODO code
     *        })
     *        it('is not a Dao Creator', async () => {
     *            // TODO code
     *        })
     *        it('is a System Admin', async () => {
     *            // TODO code
     *        })
     *        it('is not a Dao Admin', async () => {
     *            // TODO code
     *        })
     *        it('is not a Dao Meeple', async () => {
     *            // TODO code
     *        })
     *    })
     *
     *    describe('Dao Admin', async () => {
     *        it('is not a Super User', async () => {
     *            // TODO code
     *        })
     *        it('is not a Dao Creator', async () => {
     *            // TODO code
     *        })
     *        it('is not a System Admin', async () => {
     *            // TODO code
     *        })
     *        it('is a Dao Admin', async () => {
     *            // TODO code
     *        })
     *        it('is a Dao Meeple', async () => {
     *            // TODO code
     *        })
     *    })
     *
     *    describe('Dao Meeple', async () => {
     *        it('is not a Super User', async () => {
     *            // TODO code
     *        })
     *        it('is not a Dao Creator', async () => {
     *            // TODO code
     *        })
     *        it('is not a System Admin', async () => {
     *            // TODO code
     *        })
     *        it('is not a Dao Admin', async () => {
     *            // TODO code
     *        })
     *        it('is a Dao Meeple', async () => {
     *            // TODO code
     *        })
     *    })
     *})
     */

    describe('DAO Admin', () => {
        describe('add member', () => {
            it('by Super User', async () => {
                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_ADMIN_ROLE,
                        memberOne.address
                    )
                ).is.false

                await accessControl
                    .connect(superUser)
                    .grantDaoAdminRole(DAO_ID, memberOne.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_ADMIN_ROLE,
                        memberOne.address
                    )
                ).is.true
            })

            it('not by System Admin', async () => {
                await expect(
                    accessControl
                        .connect(sysAdmin)
                        .grantDaoAdminRole(DAO_ID, memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        sysAdmin,
                        DAO_ID,
                        DAO_ADMIN
                    )
                )
            })

            it('not by Dao Creator', async () => {
                await expect(
                    accessControl
                        .connect(daoCreator)
                        .grantDaoAdminRole(DAO_ID, memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        daoCreator,
                        DAO_ID,
                        DAO_ADMIN
                    )
                )
            })

            it('by Dao Admin', async () => {
                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_ADMIN_ROLE,
                        memberTwo.address
                    )
                ).is.false

                await accessControl
                    .connect(daoAdmin)
                    .grantDaoAdminRole(DAO_ID, memberTwo.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_ADMIN_ROLE,
                        memberTwo.address
                    )
                ).is.true
            })

            it('not by Dao Meeple', async () => {
                await expect(
                    accessControl
                        .connect(daoMeeple)
                        .grantDaoAdminRole(DAO_ID, memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        daoMeeple,
                        DAO_ID,
                        DAO_ADMIN
                    )
                )
            })
        })

        before(async () => {
            await successfulTransaction(
                accessControl.grantDaoAdminRole(DAO_ID, memberOne.address)
            )
        })
        after(async () => {
            if (
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne.address
                )
            ) {
                await successfulTransaction(
                    accessControl.revokeDaoAdminRole(DAO_ID, memberOne.address)
                )
            }
        })

        it('role scoped to dao id', async () => {
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne.address
                )
            ).is.true

            expect(
                await accessControl.hasDaoRole(
                    OTHER_DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne.address
                )
            ).is.false
        })

        it('cannot grant role twice', async () => {
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne.address
                )
            ).is.true

            await expect(
                accessControl.grantDaoAdminRole(DAO_ID, memberOne.address)
            ).to.be.revertedWith(
                accessControlRevertMessageAlreadyRoleMember(
                    memberOne,
                    DAO_ADMIN
                )
            )
        })

        // TODO access attempts for each role
        it('remove member', async () => {
            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne.address
                )
            ).is.true

            await accessControl.revokeDaoAdminRole(DAO_ID, memberOne.address)

            expect(
                await accessControl.hasDaoRole(
                    DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne.address
                )
            ).is.false
        })
    })

    // TODO duplicate DAO admin access structure
    describe('Sys Admin', () => {
        it('add member', async () => {
            expect(
                await accessControl.hasGlobalRole(
                    SYS_ADMIN_ROLE,
                    memberTwo.address
                )
            ).is.false

            await accessControl.grantSysAdminRole(memberTwo.address)

            expect(
                await accessControl.hasGlobalRole(
                    SYS_ADMIN_ROLE,
                    memberTwo.address
                )
            ).is.true
        })

        it('remove member', async () => {
            expect(
                await accessControl.hasGlobalRole(
                    SYS_ADMIN_ROLE,
                    memberTwo.address
                )
            ).is.true

            await accessControl.revokeSysAdminRole(memberTwo.address)

            expect(
                await accessControl.hasGlobalRole(
                    SYS_ADMIN_ROLE,
                    memberTwo.address
                )
            ).is.false
        })
    })

    let superUser: SignerWithAddress
    let sysAdmin: SignerWithAddress
    let daoCreator: SignerWithAddress
    let daoAdmin: SignerWithAddress
    let daoMeeple: SignerWithAddress
    let memberOne: SignerWithAddress
    let memberTwo: SignerWithAddress
    let memberThree: SignerWithAddress
    let accessControl: BondAccessControlBox
})
