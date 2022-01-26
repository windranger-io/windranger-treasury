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
        nonBondAggregator = await signer(5)
        nonBondAdmin = await signer(6)
        treasury = (await signer(7)).address
        curator = await deployContractWithProxy<BondManager>('BondManager')
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        collateralSymbol = await collateralTokens.symbol()
        creator = await deployContractWithProxy<BondFactory>(
            'BondFactory',
            collateralTokens.address,
            treasury
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
                curator
                    .connect(nonBondAggregator)
                    .addBond(constants.AddressZero)
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

        it('only when not paused', async () => {
            const bond = await createBond()
            expect(await curator.paused()).is.false
            await successfulTransaction(curator.pause())
            expect(await curator.paused()).is.true

            await expect(curator.addBond(bond.address)).to.be.revertedWith(
                'Pausable: paused'
            )

            await successfulTransaction(curator.unpause())
            expect(await curator.paused()).is.false
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

    describe('bond', () => {
        beforeEach(async () => {
            curator = await deployContractWithProxy<BondManager>('BondManager')
            bond = await createBond()
        })

        describe('allow redemption', () => {
            it('calls bond', async () => {
                expect(await bond.redeemable()).is.false
                await successfulTransaction(curator.addBond(bond.address))

                await successfulTransaction(
                    curator.bondAllowRedemption(bond.address)
                )

                expect(await bond.redeemable()).is.true
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondAllowRedemption(bond.address)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondAllowRedemption(bond.address)
                ).to.be.revertedWith(
                    'AccessControl: account 0x976ea74026e726554db657fa54763abd0c3a0aa9 is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondAllowRedemption(bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('deposit', () => {
            it('calls bond', async () => {
                // TODO bondDeposit
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondDeposit(bond.address, 1n)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondDeposit(bond.address, 1n)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('pause', () => {
            it('calls bond', async () => {
                expect(await bond.paused()).is.false
                await successfulTransaction(curator.addBond(bond.address))

                await successfulTransaction(curator.bondPause(bond.address))

                expect(await bond.paused()).is.true
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondPause(bond.address)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator.connect(nonBondAdmin).bondPause(bond.address)
                ).to.be.revertedWith(
                    'AccessControl: account 0x976ea74026e726554db657fa54763abd0c3a0aa9 is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondPause(bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('slash', () => {
            it('calls bond', async () => {
                // TODO bondSlash
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondSlash(bond.address, 5n)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator.connect(nonBondAdmin).bondSlash(bond.address, 5n)
                ).to.be.revertedWith(
                    'AccessControl: account 0x976ea74026e726554db657fa54763abd0c3a0aa9 is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondSlash(bond.address, 4n)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('set metadata', () => {
            it('calls bond', async () => {
                await successfulTransaction(curator.addBond(bond.address))
                expect(await bond.metaData()).equals('')

                await successfulTransaction(
                    curator.bondSetMetaData(bond.address, 'new meta data')
                )

                expect(await bond.metaData()).equals('new meta data')
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondSetMetaData(bond.address, 'meta')
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondSetMetaData(bond.address, 'meta')
                ).to.be.revertedWith(
                    'AccessControl: account 0x976ea74026e726554db657fa54763abd0c3a0aa9 is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondSetMetaData(bond.address, 'data')
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('set treasury', () => {
            it('calls bond', async () => {
                await successfulTransaction(curator.addBond(bond.address))
                expect(await bond.treasury()).equals(treasury)

                await successfulTransaction(
                    curator.bondSetTreasury(bond.address, curator.address)
                )

                expect(await bond.treasury()).equals(curator.address)
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondSetTreasury(bond.address, bond.address)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondSetTreasury(bond.address, bond.address)
                ).to.be.revertedWith(
                    'AccessControl: account 0x976ea74026e726554db657fa54763abd0c3a0aa9 is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondSetTreasury(bond.address, bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('unpause', () => {
            it('calls bond', async () => {
                expect(await bond.paused()).is.false
                await successfulTransaction(curator.addBond(bond.address))
                await successfulTransaction(curator.bondPause(bond.address))
                expect(await bond.paused()).is.true

                await successfulTransaction(curator.bondUnpause(bond.address))

                expect(await bond.paused()).is.false
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondUnpause(bond.address)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator.connect(nonBondAdmin).bondUnpause(bond.address)
                ).to.be.revertedWith(
                    'AccessControl: account 0x976ea74026e726554db657fa54763abd0c3a0aa9 is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondUnpause(bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('withdraw collateral', () => {
            it('calls bond', async () => {
                // TODO bondWithdrawCollateral
            })

            it('only when managing', async () => {
                await expect(
                    curator.bondWithdrawCollateral(bond.address)
                ).to.be.revertedWith('BondManager: not managing')
            })

            it('only bond admin', async () => {
                await expect(
                    curator
                        .connect(nonBondAdmin)
                        .bondWithdrawCollateral(bond.address)
                ).to.be.revertedWith(
                    'AccessControl: account 0x976ea74026e726554db657fa54763abd0c3a0aa9 is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(curator.pause())
                expect(await curator.paused()).is.true

                await expect(
                    curator.bondWithdrawCollateral(bond.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        let bond: ERC20SingleCollateralBond
    })

    describe('pause', () => {
        it('changes state', async () => {
            expect(await curator.paused()).is.true
            await successfulTransaction(curator.unpause())
            expect(await curator.paused()).is.false

            await curator.pause()

            expect(await curator.paused()).is.true
        })

        it('only when not paused', async () => {
            expect(await curator.paused()).is.true

            await expect(curator.pause()).to.be.revertedWith('Pausable: paused')
        })

        it('only owner', async () => {
            await expect(
                curator.connect(nonBondAdmin).unpause()
            ).to.be.revertedWith(
                'AccessControl: account 0x976ea74026e726554db657fa54763abd0c3a0aa9 is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
            )
        })
    })

    describe('unpause', () => {
        it('changes state', async () => {
            expect(await curator.paused()).is.true

            await curator.unpause()

            expect(await curator.paused()).is.false
        })

        it('only when paused', async () => {
            await expect(curator.unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })

        it('only owner', async () => {
            await expect(
                curator.connect(nonBondAdmin).pause()
            ).to.be.revertedWith(
                'AccessControl: account 0x976ea74026e726554db657fa54763abd0c3a0aa9 is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
            )
        })
    })

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
    let treasury: string
    let nonBondAdmin: SignerWithAddress
    let nonBondAggregator: SignerWithAddress
    let curator: BondManager
    let collateralTokens: ERC20
    let collateralSymbol: string
    let creator: BondFactory
})
