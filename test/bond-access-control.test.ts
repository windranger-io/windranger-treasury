// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {
    BOND_ADMIN_ROLE,
    DAO_ADMIN_ROLE,
    SYSTEM_ADMIN_ROLE
} from './contracts/roles'
import {before} from 'mocha'
import {
    deployContract,
    deployContractWithProxy,
    signer
} from './framework/contracts'
import {BitDAO, BondFactory} from '../typechain-types'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ExtendedERC20} from './contracts/cast/extended-erc20'
import {solidity} from 'ethereum-waffle'

// Wires up Waffle with Chai
chai.use(solidity)

// TODO refactor the contracts
describe('Bond Access Control contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
        memberOne = (await signer(3)).address
        memberTwo = (await signer(4)).address
        memberThree = (await signer(5)).address
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        collateralSymbol = await collateralTokens.symbol()
        bonds = await deployContractWithProxy<BondFactory>(
            'BondFactory',
            collateralTokens.address,
            treasury
        )
    })

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
            expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is.false

            await bonds.grantRole(SYSTEM_ADMIN_ROLE, memberThree)

            expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
            expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is.true
        })

        it('remove member', async () => {
            expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
            expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is.true

            await bonds.revokeRole(SYSTEM_ADMIN_ROLE, admin)

            expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.false
            expect(await bonds.hasRole(SYSTEM_ADMIN_ROLE, memberThree)).is.true
        })

        it('DAO Admin is the role admin', async () => {
            expect(await bonds.getRoleAdmin(SYSTEM_ADMIN_ROLE)).equals(
                DAO_ADMIN_ROLE
            )
        })
    })

    let admin: string
    let treasury: string
    let memberOne: string
    let memberTwo: string
    let memberThree: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ExtendedERC20
    let collateralSymbol: string
    let bonds: BondFactory
})
