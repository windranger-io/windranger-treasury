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
    accessControlRevertMessageAlreadyDaoRoleMember,
    accessControlRevertMessageAlreadyGlobalRoleMember,
    accessControlRevertMessageMissingDaoRole,
    accessControlRevertMessageMissingGlobalRole
} from './contracts/bond/access-control-messages'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'

// Wires up Waffle with Chai
chai.use(solidity)

const DAO_ID = 1n
const OTHER_DAO_ID = 2n
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
        await ensureDaoAdminRoleMembership(daoAdmin)
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
            before(async () => {
                await ensureDaoAdminRoleMembershipMissing(memberOne)
            })
            after(async () => {
                await ensureDaoAdminRoleMembership(memberOne)
            })

            it('by Super User', async () => {
                await verifyDaoRoleMembershipMissing(DAO_ADMIN_ROLE, memberOne)

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

            it('by Dao Admin', async () => {
                await verifyDaoRoleMembershipMissing(DAO_ADMIN_ROLE, memberTwo)

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
                await verifyDaoRoleMembership(DAO_ADMIN_ROLE, memberOne)

                await accessControl
                    .connect(superUser)
                    .revokeDaoAdminRole(DAO_ID, memberOne.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_ADMIN_ROLE,
                        memberOne.address
                    )
                ).is.false
            })

            it('by Dao Admin', async () => {
                await verifyDaoRoleMembership(DAO_ADMIN_ROLE, memberTwo)

                await accessControl
                    .connect(daoAdmin)
                    .revokeDaoAdminRole(DAO_ID, memberTwo.address)

                expect(
                    await accessControl.hasDaoRole(
                        DAO_ID,
                        DAO_ADMIN_ROLE,
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
            await verifyDaoRoleMembership(DAO_ADMIN_ROLE, memberOne)

            expect(
                await accessControl.hasDaoRole(
                    OTHER_DAO_ID,
                    DAO_ADMIN_ROLE,
                    memberOne.address
                )
            ).is.false
        })

        it('cannot grant role twice', async () => {
            await verifyDaoRoleMembership(DAO_ADMIN_ROLE, memberOne)

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

    // TODO duplicate DAO admin access structure
    describe('System Admin', () => {
        describe('add member', () => {
            before(async () => {
                await ensureSysAdminRoleMembershipMissing(memberOne)
            })
            after(async () => {
                await ensureSysAdminRoleMembership(memberOne)
            })

            it('by Super User', async () => {
                await verifyGlobalRoleMembershipMissing(
                    SYS_ADMIN_ROLE,
                    memberOne
                )

                await accessControl
                    .connect(superUser)
                    .grantSysAdminRole(memberOne.address)

                expect(
                    await accessControl.hasGlobalRole(
                        SYS_ADMIN_ROLE,
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
                await verifyGlobalRoleMembershipMissing(
                    SYS_ADMIN_ROLE,
                    memberTwo
                )

                await accessControl
                    .connect(sysAdmin)
                    .grantSysAdminRole(memberTwo.address)

                expect(
                    await accessControl.hasGlobalRole(
                        SYS_ADMIN_ROLE,
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
                await verifyGlobalRoleMembership(SYS_ADMIN_ROLE, memberOne)

                await accessControl
                    .connect(superUser)
                    .revokeSysAdminRole(memberOne.address)

                expect(
                    await accessControl.hasGlobalRole(
                        SYS_ADMIN_ROLE,
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
                await verifyGlobalRoleMembership(SYS_ADMIN_ROLE, memberTwo)

                await accessControl
                    .connect(sysAdmin)
                    .revokeSysAdminRole(memberTwo.address)

                expect(
                    await accessControl.hasGlobalRole(
                        SYS_ADMIN_ROLE,
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
            await verifyGlobalRoleMembership(SYS_ADMIN_ROLE, memberOne)

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
                DAO_ADMIN_ROLE,
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
                DAO_ADMIN_ROLE,
                member.address
            )
        ) {
            await successfulTransaction(
                accessControl.revokeDaoAdminRole(DAO_ID, member.address)
            )
        }
    }

    async function ensureSysAdminRoleMembership(member: SignerWithAddress) {
        if (
            !(await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, member.address))
        ) {
            await successfulTransaction(
                accessControl.grantSysAdminRole(member.address)
            )
        }
    }

    async function ensureSysAdminRoleMembershipMissing(
        member: SignerWithAddress
    ) {
        if (await accessControl.hasGlobalRole(SYS_ADMIN_ROLE, member.address)) {
            await successfulTransaction(
                accessControl.revokeSysAdminRole(member.address)
            )
        }
    }

    async function verifyDaoRoleMembership(
        role: string,
        member: SignerWithAddress
    ): Promise<void> {
        expect(await accessControl.hasDaoRole(DAO_ID, role, member.address)).is
            .true
    }

    async function verifyDaoRoleMembershipMissing(
        role: string,
        member: SignerWithAddress
    ): Promise<void> {
        expect(await accessControl.hasDaoRole(DAO_ID, role, member.address)).is
            .false
    }

    async function verifyGlobalRoleMembership(
        role: string,
        member: SignerWithAddress
    ): Promise<void> {
        expect(await accessControl.hasGlobalRole(role, member.address)).is.true
    }

    async function verifyGlobalRoleMembershipMissing(
        role: string,
        member: SignerWithAddress
    ): Promise<void> {
        expect(await accessControl.hasGlobalRole(role, member.address)).is.false
    }

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
