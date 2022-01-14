// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BitDAO, BondManager, ERC20} from '../typechain'
import {
    deployContract,
    deployContractWithProxy,
    signer
} from './framework/contracts'

import {utils} from 'ethers'
import {
    BOND_ADMIN_ROLE,
    BOND_AGGREGATOR_ROLE,
    DAO_ADMIN_ROLE,
    SYSTEM_ADMIN_ROLE
} from './contracts/roles'

// Wires up Waffle with Chai
chai.use(solidity)

describe('BondManager contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        memberOne = (await signer(2)).address
        memberTwo = (await signer(3)).address
        memberThree = (await signer(4)).address
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        collateralSymbol = await collateralTokens.symbol()
        bonds = await deployContractWithProxy<BondManager>('BondManager')
    })

    describe('Access control', () => {
        describe('Bond Admin', () => {
            it('modifier', async () => {
                expect(await bonds.hasRole(BOND_ADMIN_ROLE, admin)).is.true

                await expect(
                    bonds.bondAllowRedemption(treasury)
                ).to.be.revertedWith('BondManager: not managing')
            })

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
            it('modifier', async () => {
                expect(await bonds.hasRole(BOND_AGGREGATOR_ROLE, admin)).is.true

                await expect(
                    bonds.bondAllowRedemption(treasury)
                ).to.be.revertedWith('BondManager: not managing')
            })

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
    let treasury: string
    let memberOne: string
    let memberTwo: string
    let memberThree: string
    let collateralTokens: ERC20
    let collateralSymbol: string
    let bonds: BondManager
})
