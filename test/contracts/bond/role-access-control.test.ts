// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {
    DAO_ADMIN,
    DAO_CREATOR,
    DAO_MEEPLE,
    Role,
    SUPER_USER,
    SYSTEM_ADMIN
} from '../../event/bond/roles'
import {before} from 'mocha'
import {deployContract, signer} from '../../framework/contracts'
import {BondAccessControlBox} from '../../../typechain-types'
import {solidity} from 'ethereum-waffle'
import {
    accessControlRevertMessageAlreadyDaoRoleMember,
    accessControlRevertMessageAlreadyGlobalRoleMember,
    accessControlRevertMessageMissingDaoRole,
    accessControlRevertMessageMissingGlobalRole
} from '../../event/bond/access-control-messages'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from '../../framework/transaction'

// Wires up Waffle with Chai
chai.use(solidity)

const DAO_ID = 1n
const OTHER_DAO_ID = 2n

describe('Role Access Control contract', () => {
    before(async () => {
        superUser = await signer(1)
        sysAdmin = await signer(2)
        daoCreator = await signer(3)
        daoAdmin = await signer(4)
        daoMeeple = await signer(5)

        memberOne = await signer(7)
        memberTwo = await signer(8)

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
        await ensureDaoAdminRoleMembership(daoAdmin)
        await successfulTransaction(
            accessControl.grantDaoMeepleRole(DAO_ID, daoMeeple.address)
        )
    })

    describe('Hierarchy', () => {
        describe('Super User role', () => {
            it('has Super User access', async () => {
                expect(
                    await accessControl.hasSuperUserAccess(superUser.address)
                ).is.true
            })
            it('has Dao Creator access', async () => {
                expect(
                    await accessControl.hasDaoCreatorAccess(superUser.address)
                ).is.true
            })
            it('has System Admin access', async () => {
                expect(await accessControl.hasSysAdminAccess(superUser.address))
                    .is.true
            })
            it('has Dao Admin access', async () => {
                expect(
                    await accessControl.hasDaoAdminAccess(
                        DAO_ID,
                        superUser.address
                    )
                ).is.true
            })
            it('has Dao Meeple access', async () => {
                expect(
                    await accessControl.hasDaoMeepleAccess(
                        DAO_ID,
                        superUser.address
                    )
                ).is.true
            })
        })

        describe('Dao Creator role', () => {
            it('lacks Super User access', async () => {
                expect(
                    await accessControl.hasSuperUserAccess(daoCreator.address)
                ).is.false
            })
            it('has Dao Creator access', async () => {
                expect(
                    await accessControl.hasDaoCreatorAccess(daoCreator.address)
                ).is.true
            })
            it('lacks System Admin access', async () => {
                expect(
                    await accessControl.hasSysAdminAccess(daoCreator.address)
                ).is.false
            })
            it('lacks Dao Admin access', async () => {
                expect(
                    await accessControl.hasDaoAdminAccess(
                        DAO_ID,
                        daoCreator.address
                    )
                ).is.false
            })
            it('lacks Dao Meeple access', async () => {
                expect(
                    await accessControl.hasDaoMeepleAccess(
                        DAO_ID,
                        daoCreator.address
                    )
                ).is.false
            })
        })

        describe('System Admin role', () => {
            it('lacks Super User access', async () => {
                expect(await accessControl.hasSuperUserAccess(sysAdmin.address))
                    .is.false
            })
            it('lacks Dao Creator access', async () => {
                expect(
                    await accessControl.hasDaoCreatorAccess(sysAdmin.address)
                ).is.false
            })
            it('has System Admin access', async () => {
                expect(await accessControl.hasSysAdminAccess(sysAdmin.address))
                    .is.true
            })
            it('lacks Dao Admin access', async () => {
                expect(
                    await accessControl.hasDaoAdminAccess(
                        DAO_ID,
                        sysAdmin.address
                    )
                ).is.false
            })
            it('lacks Dao Meeple access', async () => {
                expect(
                    await accessControl.hasDaoMeepleAccess(
                        DAO_ID,
                        sysAdmin.address
                    )
                ).is.false
            })
        })

        describe('Dao Admin role', () => {
            it('lacks Super User access', async () => {
                expect(await accessControl.hasSuperUserAccess(daoAdmin.address))
                    .is.false
            })
            it('lacks Dao Creator access', async () => {
                expect(
                    await accessControl.hasDaoCreatorAccess(daoAdmin.address)
                ).is.false
            })
            it('lacks System Admin access', async () => {
                expect(await accessControl.hasSysAdminAccess(daoAdmin.address))
                    .is.false
            })
            it('has Dao Admin access', async () => {
                expect(
                    await accessControl.hasDaoAdminAccess(
                        DAO_ID,
                        daoAdmin.address
                    )
                ).is.true
            })
            it('has Dao Meeple access', async () => {
                expect(
                    await accessControl.hasDaoAdminAccess(
                        DAO_ID,
                        daoAdmin.address
                    )
                ).is.true
            })
        })

        describe('Dao Meeple role', () => {
            it('lacks Super User access', async () => {
                expect(
                    await accessControl.hasSuperUserAccess(daoMeeple.address)
                ).is.false
            })
            it('lacks Dao Creator access', async () => {
                expect(
                    await accessControl.hasDaoCreatorAccess(daoMeeple.address)
                ).is.false
            })
            it('lacks System Admin access', async () => {
                expect(await accessControl.hasSysAdminAccess(daoMeeple.address))
                    .is.false
            })
            it('lacks Dao Admin access', async () => {
                expect(
                    await accessControl.hasDaoAdminAccess(
                        DAO_ID,
                        daoMeeple.address
                    )
                ).is.false
            })
            it('has Dao Meeple access', async () => {
                expect(
                    await accessControl.hasDaoMeepleAccess(
                        DAO_ID,
                        daoMeeple.address
                    )
                ).is.true
            })
        })
    })

    describe('DAO Admin', () => {
        describe('add member', () => {
            before(async () => {
                await ensureDaoAdminRoleMembershipMissing(memberOne)
            })
            after(async () => {
                await ensureDaoAdminRoleMembership(memberOne)
            })

            it('by Super User', async () => {
                await verifyDaoRoleMembershipMissing(DAO_ADMIN, memberOne)

                await accessControl
                    .connect(superUser)
                    .grantDaoAdminRole(DAO_ID, memberOne.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_ADMIN.hex,
                        memberOne.address
                    )
                ).is.true
            })

            it('by Dao Admin', async () => {
                await verifyDaoRoleMembershipMissing(DAO_ADMIN, memberTwo)

                await accessControl
                    .connect(daoAdmin)
                    .grantDaoAdminRole(DAO_ID, memberTwo.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_ADMIN.hex,
                        memberTwo.address
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
                        DAO_ADMIN,
                        DAO_ID
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
                        DAO_ADMIN,
                        DAO_ID
                    )
                )
            })

            it('not by Dao Meeple', async () => {
                await expect(
                    accessControl
                        .connect(daoMeeple)
                        .grantDaoAdminRole(DAO_ID, memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        daoMeeple,
                        DAO_ADMIN,
                        DAO_ID
                    )
                )
            })
        })

        describe('remove member', () => {
            before(async () => {
                await ensureDaoAdminRoleMembership(memberOne)
                await ensureDaoAdminRoleMembership(memberTwo)
            })
            after(async () => {
                await ensureDaoAdminRoleMembershipMissing(memberOne)
            })

            it('by Super User', async () => {
                await verifyDaoRoleMembership(DAO_ADMIN, memberOne)

                await accessControl
                    .connect(superUser)
                    .revokeDaoAdminRole(DAO_ID, memberOne.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_ADMIN.hex,
                        memberOne.address
                    )
                ).is.false
            })

            it('by Dao Admin', async () => {
                await verifyDaoRoleMembership(DAO_ADMIN, memberTwo)

                await accessControl
                    .connect(daoAdmin)
                    .revokeDaoAdminRole(DAO_ID, memberTwo.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_ADMIN.hex,
                        memberTwo.address
                    )
                ).is.false
            })

            it('not by System Admin', async () => {
                await expect(
                    accessControl
                        .connect(sysAdmin)
                        .revokeDaoAdminRole(DAO_ID, memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        sysAdmin,
                        DAO_ADMIN,
                        DAO_ID
                    )
                )
            })

            it('not by Dao Creator', async () => {
                await expect(
                    accessControl
                        .connect(daoCreator)
                        .revokeDaoAdminRole(DAO_ID, memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        daoCreator,
                        DAO_ADMIN,
                        DAO_ID
                    )
                )
            })

            it('not by Dao Meeple', async () => {
                await expect(
                    accessControl
                        .connect(daoMeeple)
                        .revokeDaoAdminRole(DAO_ID, memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        daoMeeple,
                        DAO_ADMIN,
                        DAO_ID
                    )
                )
            })
        })

        before(async () => {
            await ensureDaoAdminRoleMembership(memberOne)
        })
        after(async () => {
            await ensureDaoAdminRoleMembershipMissing(memberOne)
        })

        it('role scoped to dao id', async () => {
            await verifyDaoRoleMembership(DAO_ADMIN, memberOne)

            expect(
                await accessControl.hasDaoRole(
                    OTHER_DAO_ID,
                    DAO_ADMIN.hex,
                    memberOne.address
                )
            ).is.false
        })

        it('cannot grant role twice', async () => {
            await verifyDaoRoleMembership(DAO_ADMIN, memberOne)

            await expect(
                accessControl.grantDaoAdminRole(DAO_ID, memberOne.address)
            ).to.be.revertedWith(
                accessControlRevertMessageAlreadyDaoRoleMember(
                    memberOne,
                    DAO_ADMIN,
                    DAO_ID
                )
            )
        })
    })

    describe('Dao Creator', () => {
        describe('add member', () => {
            before(async () => {
                await ensureDaoCreatorRoleMembershipMissing(memberOne)
            })
            after(async () => {
                await ensureDaoCreatorRoleMembership(memberOne)
            })

            it('by Super User', async () => {
                await verifyGlobalRoleMembershipMissing(DAO_CREATOR, memberOne)

                await accessControl
                    .connect(superUser)
                    .grantDaoCreatorRole(memberOne.address)

                expect(
                    await accessControl.hasGlobalRole(
                        DAO_CREATOR.hex,
                        memberOne.address
                    )
                ).is.true
            })

            it('not by Dao Admin', async () => {
                await expect(
                    accessControl
                        .connect(daoAdmin)
                        .grantDaoCreatorRole(memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoAdmin,
                        SUPER_USER
                    )
                )
            })

            it('not by System Admin', async () => {
                await expect(
                    accessControl
                        .connect(sysAdmin)
                        .grantDaoCreatorRole(memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        sysAdmin,
                        SUPER_USER
                    )
                )
            })

            it('not by Dao Creator', async () => {
                await expect(
                    accessControl
                        .connect(daoCreator)
                        .grantDaoCreatorRole(memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoCreator,
                        SUPER_USER
                    )
                )
            })

            it('not by Dao Meeple', async () => {
                await expect(
                    accessControl
                        .connect(daoMeeple)
                        .grantDaoCreatorRole(memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoMeeple,
                        SUPER_USER
                    )
                )
            })
        })

        describe('remove member', () => {
            before(async () => {
                await ensureDaoCreatorRoleMembership(memberOne)
                await ensureDaoCreatorRoleMembership(memberTwo)
            })
            after(async () => {
                await ensureDaoCreatorRoleMembershipMissing(memberOne)
            })

            it('by Super User', async () => {
                await verifyGlobalRoleMembership(DAO_CREATOR, memberOne)

                await accessControl
                    .connect(superUser)
                    .revokeDaoCreatorRole(memberOne.address)

                expect(
                    await accessControl.hasGlobalRole(
                        DAO_CREATOR.hex,
                        memberOne.address
                    )
                ).is.false
            })

            it('not by Dao Admin', async () => {
                await expect(
                    accessControl
                        .connect(daoAdmin)
                        .revokeDaoCreatorRole(memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoAdmin,
                        SUPER_USER
                    )
                )
            })

            it('not by System Admin', async () => {
                await expect(
                    accessControl
                        .connect(sysAdmin)
                        .revokeDaoCreatorRole(memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        sysAdmin,
                        SUPER_USER
                    )
                )
            })

            it('not by Dao Creator', async () => {
                await expect(
                    accessControl
                        .connect(daoCreator)
                        .revokeDaoCreatorRole(memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoCreator,
                        SUPER_USER
                    )
                )
            })

            it('not by Dao Meeple', async () => {
                await expect(
                    accessControl
                        .connect(daoMeeple)
                        .revokeDaoCreatorRole(memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoMeeple,
                        SUPER_USER
                    )
                )
            })
        })

        before(async () => {
            await ensureDaoCreatorRoleMembership(memberOne)
        })
        after(async () => {
            await ensureDaoCreatorRoleMembershipMissing(memberOne)
        })

        it('cannot grant role twice', async () => {
            await verifyGlobalRoleMembership(DAO_CREATOR, memberOne)

            await expect(
                accessControl.grantDaoCreatorRole(memberOne.address)
            ).to.be.revertedWith(
                accessControlRevertMessageAlreadyGlobalRoleMember(
                    memberOne,
                    DAO_CREATOR
                )
            )
        })
    })

    describe('DAO Meeple', () => {
        describe('add member', () => {
            before(async () => {
                await ensureDaoMeepleRoleMembershipMissing(memberOne)
            })
            after(async () => {
                await ensureDaoMeepleRoleMembership(memberOne)
            })

            it('by Super User', async () => {
                await verifyDaoRoleMembershipMissing(DAO_MEEPLE, memberOne)

                await accessControl
                    .connect(superUser)
                    .grantDaoMeepleRole(DAO_ID, memberOne.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_MEEPLE.hex,
                        memberOne.address
                    )
                ).is.true
            })

            it('by Dao Admin', async () => {
                await verifyDaoRoleMembershipMissing(DAO_MEEPLE, memberTwo)

                await accessControl
                    .connect(daoAdmin)
                    .grantDaoMeepleRole(DAO_ID, memberTwo.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_MEEPLE.hex,
                        memberTwo.address
                    )
                ).is.true
            })

            it('not by System Admin', async () => {
                await expect(
                    accessControl
                        .connect(sysAdmin)
                        .grantDaoMeepleRole(DAO_ID, memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        sysAdmin,
                        DAO_ADMIN,
                        DAO_ID
                    )
                )
            })

            it('not by Dao Creator', async () => {
                await expect(
                    accessControl
                        .connect(daoCreator)
                        .grantDaoMeepleRole(DAO_ID, memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        daoCreator,
                        DAO_ADMIN,
                        DAO_ID
                    )
                )
            })

            it('not by Dao Meeple', async () => {
                await expect(
                    accessControl
                        .connect(daoMeeple)
                        .grantDaoMeepleRole(DAO_ID, memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        daoMeeple,
                        DAO_ADMIN,
                        DAO_ID
                    )
                )
            })
        })

        describe('remove member', () => {
            before(async () => {
                await ensureDaoMeepleRoleMembership(memberOne)
                await ensureDaoMeepleRoleMembership(memberTwo)
            })
            after(async () => {
                await ensureDaoMeepleRoleMembershipMissing(memberOne)
            })

            it('by Super User', async () => {
                await verifyDaoRoleMembership(DAO_MEEPLE, memberOne)

                await accessControl
                    .connect(superUser)
                    .revokeDaoMeepleRole(DAO_ID, memberOne.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_MEEPLE.hex,
                        memberOne.address
                    )
                ).is.false
            })

            it('by Dao Admin', async () => {
                await verifyDaoRoleMembership(DAO_MEEPLE, memberTwo)

                await accessControl
                    .connect(daoAdmin)
                    .revokeDaoMeepleRole(DAO_ID, memberTwo.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_MEEPLE.hex,
                        memberTwo.address
                    )
                ).is.false
            })

            it('not by System Admin', async () => {
                await expect(
                    accessControl
                        .connect(sysAdmin)
                        .revokeDaoMeepleRole(DAO_ID, memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        sysAdmin,
                        DAO_ADMIN,
                        DAO_ID
                    )
                )
            })

            it('not by Dao Creator', async () => {
                await expect(
                    accessControl
                        .connect(daoCreator)
                        .revokeDaoMeepleRole(DAO_ID, memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        daoCreator,
                        DAO_ADMIN,
                        DAO_ID
                    )
                )
            })

            it('not by Dao Meeple', async () => {
                await expect(
                    accessControl
                        .connect(daoMeeple)
                        .revokeDaoMeepleRole(DAO_ID, memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingDaoRole(
                        daoMeeple,
                        DAO_ADMIN,
                        DAO_ID
                    )
                )
            })
        })

        before(async () => {
            await ensureDaoMeepleRoleMembership(memberOne)
        })
        after(async () => {
            await ensureDaoMeepleRoleMembershipMissing(memberOne)
        })

        it('role scoped to dao id', async () => {
            await verifyDaoRoleMembership(DAO_MEEPLE, memberOne)

            expect(
                await accessControl.hasDaoRole(
                    OTHER_DAO_ID,
                    DAO_MEEPLE.hex,
                    memberOne.address
                )
            ).is.false
        })

        it('cannot grant role twice', async () => {
            await verifyDaoRoleMembership(DAO_MEEPLE, memberOne)

            await expect(
                accessControl.grantDaoMeepleRole(DAO_ID, memberOne.address)
            ).to.be.revertedWith(
                accessControlRevertMessageAlreadyDaoRoleMember(
                    memberOne,
                    DAO_MEEPLE,
                    DAO_ID
                )
            )
        })
    })

    describe('Super User', () => {
        describe('add member', () => {
            before(async () => {
                await ensureSuperUserRoleMembershipMissing(memberOne)
            })
            after(async () => {
                await ensureSuperUserRoleMembership(memberOne)
            })

            it('by Super User', async () => {
                await verifyGlobalRoleMembershipMissing(SUPER_USER, memberOne)

                await accessControl
                    .connect(superUser)
                    .grantSuperUserRole(memberOne.address)

                expect(
                    await accessControl.hasGlobalRole(
                        SUPER_USER.hex,
                        memberOne.address
                    )
                ).is.true
            })

            it('not by Dao Admin', async () => {
                await expect(
                    accessControl
                        .connect(daoAdmin)
                        .grantSuperUserRole(memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoAdmin,
                        SUPER_USER
                    )
                )
            })

            it('not by System Admin', async () => {
                await expect(
                    accessControl
                        .connect(sysAdmin)
                        .grantSuperUserRole(memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        sysAdmin,
                        SUPER_USER
                    )
                )
            })

            it('not by Dao Creator', async () => {
                await expect(
                    accessControl
                        .connect(daoCreator)
                        .grantSuperUserRole(memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoCreator,
                        SUPER_USER
                    )
                )
            })

            it('not by Dao Meeple', async () => {
                await expect(
                    accessControl
                        .connect(daoMeeple)
                        .grantSuperUserRole(memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoMeeple,
                        SUPER_USER
                    )
                )
            })
        })

        describe('remove member', () => {
            before(async () => {
                await ensureSuperUserRoleMembership(memberOne)
                await ensureSuperUserRoleMembership(memberTwo)
            })
            after(async () => {
                await ensureSuperUserRoleMembershipMissing(memberOne)
            })

            it('by Super User', async () => {
                await verifyGlobalRoleMembership(SUPER_USER, memberOne)

                await accessControl
                    .connect(superUser)
                    .revokeSuperUserRole(memberOne.address)

                expect(
                    await accessControl.hasGlobalRole(
                        SUPER_USER.hex,
                        memberOne.address
                    )
                ).is.false
            })

            it('not by Dao Admin', async () => {
                await expect(
                    accessControl
                        .connect(daoAdmin)
                        .revokeSuperUserRole(memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoAdmin,
                        SUPER_USER
                    )
                )
            })

            it('not by System Admin', async () => {
                await expect(
                    accessControl
                        .connect(sysAdmin)
                        .revokeSuperUserRole(memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        sysAdmin,
                        SUPER_USER
                    )
                )
            })

            it('not by Dao Creator', async () => {
                await expect(
                    accessControl
                        .connect(daoCreator)
                        .revokeSuperUserRole(memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoCreator,
                        SUPER_USER
                    )
                )
            })

            it('not by Dao Meeple', async () => {
                await expect(
                    accessControl
                        .connect(daoMeeple)
                        .revokeSuperUserRole(memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoMeeple,
                        SUPER_USER
                    )
                )
            })

            it('not all Super Users', async () => {
                await ensureSuperUserRoleMembershipMissing(memberOne)
                await ensureSuperUserRoleMembershipMissing(memberTwo)
                await expect(
                    accessControl
                        .connect(superUser)
                        .revokeSuperUserRole(superUser.address)
                ).to.be.revertedWith('RAC: no revoking last SuperUser')
            })
        })

        before(async () => {
            await ensureSuperUserRoleMembership(memberOne)
        })
        after(async () => {
            await ensureSuperUserRoleMembershipMissing(memberOne)
        })

        it('cannot grant role twice', async () => {
            await verifyGlobalRoleMembership(SUPER_USER, memberOne)

            await expect(
                accessControl.grantSuperUserRole(memberOne.address)
            ).to.be.revertedWith(
                accessControlRevertMessageAlreadyGlobalRoleMember(
                    memberOne,
                    SUPER_USER
                )
            )
        })
    })

    describe('System Admin', () => {
        describe('add member', () => {
            before(async () => {
                await ensureSysAdminRoleMembershipMissing(memberOne)
            })
            after(async () => {
                await ensureSysAdminRoleMembership(memberOne)
            })

            it('by Super User', async () => {
                await verifyGlobalRoleMembershipMissing(SYSTEM_ADMIN, memberOne)

                await accessControl
                    .connect(superUser)
                    .grantSysAdminRole(memberOne.address)

                expect(
                    await accessControl.hasGlobalRole(
                        SYSTEM_ADMIN.hex,
                        memberOne.address
                    )
                ).is.true
            })

            it('not by Dao Admin', async () => {
                await expect(
                    accessControl
                        .connect(daoAdmin)
                        .grantSysAdminRole(memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoAdmin,
                        SYSTEM_ADMIN
                    )
                )
            })

            it('by System Admin', async () => {
                await verifyGlobalRoleMembershipMissing(SYSTEM_ADMIN, memberTwo)

                await accessControl
                    .connect(sysAdmin)
                    .grantSysAdminRole(memberTwo.address)

                expect(
                    await accessControl.hasGlobalRole(
                        SYSTEM_ADMIN.hex,
                        memberTwo.address
                    )
                ).is.true
            })

            it('not by Dao Creator', async () => {
                await expect(
                    accessControl
                        .connect(daoCreator)
                        .grantSysAdminRole(memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoCreator,
                        SYSTEM_ADMIN
                    )
                )
            })

            it('not by Dao Meeple', async () => {
                await expect(
                    accessControl
                        .connect(daoMeeple)
                        .grantSysAdminRole(memberTwo.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoMeeple,
                        SYSTEM_ADMIN
                    )
                )
            })
        })

        describe('remove member', () => {
            before(async () => {
                await ensureSysAdminRoleMembership(memberOne)
                await ensureSysAdminRoleMembership(memberTwo)
            })
            after(async () => {
                await ensureSysAdminRoleMembershipMissing(memberOne)
            })

            it('by Super User', async () => {
                await verifyGlobalRoleMembership(SYSTEM_ADMIN, memberOne)

                await accessControl
                    .connect(superUser)
                    .revokeSysAdminRole(memberOne.address)

                expect(
                    await accessControl.hasGlobalRole(
                        SYSTEM_ADMIN.hex,
                        memberOne.address
                    )
                ).is.false
            })

            it('not by Dao Admin', async () => {
                await expect(
                    accessControl
                        .connect(daoAdmin)
                        .revokeSysAdminRole(memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoAdmin,
                        SYSTEM_ADMIN
                    )
                )
            })

            it('by System Admin', async () => {
                await verifyGlobalRoleMembership(SYSTEM_ADMIN, memberTwo)

                await accessControl
                    .connect(sysAdmin)
                    .revokeSysAdminRole(memberTwo.address)

                expect(
                    await accessControl.hasGlobalRole(
                        SYSTEM_ADMIN.hex,
                        memberTwo.address
                    )
                ).is.false
            })

            it('not by Dao Creator', async () => {
                await expect(
                    accessControl
                        .connect(daoCreator)
                        .revokeSysAdminRole(memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoCreator,
                        SYSTEM_ADMIN
                    )
                )
            })

            it('not by Dao Meeple', async () => {
                await expect(
                    accessControl
                        .connect(daoMeeple)
                        .revokeSysAdminRole(memberOne.address)
                ).to.be.revertedWith(
                    accessControlRevertMessageMissingGlobalRole(
                        daoMeeple,
                        SYSTEM_ADMIN
                    )
                )
            })
        })

        before(async () => {
            await ensureSysAdminRoleMembership(memberOne)
        })
        after(async () => {
            await ensureSysAdminRoleMembershipMissing(memberOne)
        })

        it('cannot grant role twice', async () => {
            await verifyGlobalRoleMembership(SYSTEM_ADMIN, memberOne)

            await expect(
                accessControl.grantSysAdminRole(memberOne.address)
            ).to.be.revertedWith(
                accessControlRevertMessageAlreadyGlobalRoleMember(
                    memberOne,
                    SYSTEM_ADMIN
                )
            )
        })
    })

    async function ensureDaoAdminRoleMembership(member: SignerWithAddress) {
        if (
            !(await accessControl.hasDaoRole(
                DAO_ID,
                DAO_ADMIN.hex,
                member.address
            ))
        ) {
            await successfulTransaction(
                accessControl.grantDaoAdminRole(DAO_ID, member.address)
            )
        }
    }

    async function ensureDaoAdminRoleMembershipMissing(
        member: SignerWithAddress
    ) {
        if (
            await accessControl.hasDaoRole(
                DAO_ID,
                DAO_ADMIN.hex,
                member.address
            )
        ) {
            await successfulTransaction(
                accessControl.revokeDaoAdminRole(DAO_ID, member.address)
            )
        }
    }

    async function ensureDaoCreatorRoleMembership(member: SignerWithAddress) {
        if (
            !(await accessControl.hasGlobalRole(
                DAO_CREATOR.hex,
                member.address
            ))
        ) {
            await successfulTransaction(
                accessControl.grantDaoCreatorRole(member.address)
            )
        }
    }

    async function ensureDaoCreatorRoleMembershipMissing(
        member: SignerWithAddress
    ) {
        if (
            await accessControl.hasGlobalRole(DAO_CREATOR.hex, member.address)
        ) {
            await successfulTransaction(
                accessControl.revokeDaoCreatorRole(member.address)
            )
        }
    }

    async function ensureDaoMeepleRoleMembership(member: SignerWithAddress) {
        if (
            !(await accessControl.hasDaoRole(
                DAO_ID,
                DAO_MEEPLE.hex,
                member.address
            ))
        ) {
            await successfulTransaction(
                accessControl.grantDaoMeepleRole(DAO_ID, member.address)
            )
        }
    }

    async function ensureDaoMeepleRoleMembershipMissing(
        member: SignerWithAddress
    ) {
        if (
            await accessControl.hasDaoRole(
                DAO_ID,
                DAO_MEEPLE.hex,
                member.address
            )
        ) {
            await successfulTransaction(
                accessControl.revokeDaoMeepleRole(DAO_ID, member.address)
            )
        }
    }

    async function ensureSuperUserRoleMembership(member: SignerWithAddress) {
        if (
            !(await accessControl.hasGlobalRole(SUPER_USER.hex, member.address))
        ) {
            await successfulTransaction(
                accessControl.grantSuperUserRole(member.address)
            )
        }
    }

    async function ensureSuperUserRoleMembershipMissing(
        member: SignerWithAddress
    ) {
        if (await accessControl.hasGlobalRole(SUPER_USER.hex, member.address)) {
            await successfulTransaction(
                accessControl.revokeSuperUserRole(member.address)
            )
        }
    }

    async function ensureSysAdminRoleMembership(member: SignerWithAddress) {
        if (
            !(await accessControl.hasGlobalRole(
                SYSTEM_ADMIN.hex,
                member.address
            ))
        ) {
            await successfulTransaction(
                accessControl.grantSysAdminRole(member.address)
            )
        }
    }

    async function ensureSysAdminRoleMembershipMissing(
        member: SignerWithAddress
    ) {
        if (
            await accessControl.hasGlobalRole(SYSTEM_ADMIN.hex, member.address)
        ) {
            await successfulTransaction(
                accessControl.revokeSysAdminRole(member.address)
            )
        }
    }

    async function verifyDaoRoleMembership(
        role: Role,
        member: SignerWithAddress
    ): Promise<void> {
        expect(await accessControl.hasDaoRole(DAO_ID, role.hex, member.address))
            .is.true
    }

    async function verifyDaoRoleMembershipMissing(
        role: Role,
        member: SignerWithAddress
    ): Promise<void> {
        expect(await accessControl.hasDaoRole(DAO_ID, role.hex, member.address))
            .is.false
    }

    async function verifyGlobalRoleMembership(
        role: Role,
        member: SignerWithAddress
    ): Promise<void> {
        expect(await accessControl.hasGlobalRole(role.hex, member.address)).is
            .true
    }

    async function verifyGlobalRoleMembershipMissing(
        role: Role,
        member: SignerWithAddress
    ): Promise<void> {
        expect(await accessControl.hasGlobalRole(role.hex, member.address)).is
            .false
    }

    let superUser: SignerWithAddress
    let sysAdmin: SignerWithAddress
    let daoCreator: SignerWithAddress
    let daoAdmin: SignerWithAddress
    let daoMeeple: SignerWithAddress
    let memberOne: SignerWithAddress
    let memberTwo: SignerWithAddress
    let accessControl: BondAccessControlBox
})
