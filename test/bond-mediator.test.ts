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
    BondMediator,
    ERC20
} from '../typechain'
import {
    deployContract,
    deployContractWithProxy,
    signer
} from './framework/contracts'
import {
    BOND_ADMIN_ROLE,
    DAO_ADMIN_ROLE,
    SYSTEM_ADMIN_ROLE
} from './contracts/roles'

// Wires up Waffle with Chai
chai.use(solidity)

describe('Bond Mediator contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        memberOne = (await signer(2)).address
        memberTwo = (await signer(3)).address
        memberThree = (await signer(4)).address
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        collateralSymbol = await collateralTokens.symbol()
        curator = await deployContractWithProxy<BondManager>('BondManager')
        creator = await deployContractWithProxy<BondFactory>(
            'BondFactory',
            collateralTokens.address,
            treasury
        )
        mediator = await deployContractWithProxy<BondMediator>(
            'BondMediator',
            creator.address,
            curator.address
        )
    })

    describe('Access control', () => {
        describe('Bond Admin', () => {
            it('add member', async () => {
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .false
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, admin)).is.true

                await mediator.grantRole(BOND_ADMIN_ROLE, memberOne)

                expect(await mediator.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .true
            })

            it('remove member', async () => {
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .true

                await mediator.revokeRole(BOND_ADMIN_ROLE, memberOne)

                expect(await mediator.hasRole(BOND_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(BOND_ADMIN_ROLE, memberOne)).is
                    .false
            })

            it('DAO Admin is the role admin', async () => {
                expect(await mediator.getRoleAdmin(BOND_ADMIN_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })

        describe('DAO Admin', () => {
            it('add member', async () => {
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                    .false

                await mediator.grantRole(DAO_ADMIN_ROLE, memberTwo)

                expect(await mediator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                    .true
            })

            it('remove member', async () => {
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                    .true

                await mediator.revokeRole(DAO_ADMIN_ROLE, memberTwo)

                expect(await mediator.hasRole(DAO_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(DAO_ADMIN_ROLE, memberTwo)).is
                    .false
            })

            it('DAO Admin is the role admin', async () => {
                expect(await mediator.getRoleAdmin(DAO_ADMIN_ROLE)).equals(
                    DAO_ADMIN_ROLE
                )
            })
        })

        describe('SysAdmin', () => {
            it('add member', async () => {
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                    .is.false

                await mediator.grantRole(SYSTEM_ADMIN_ROLE, memberThree)

                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                    .is.true
            })

            it('remove member', async () => {
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is.true
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                    .is.true

                await mediator.revokeRole(SYSTEM_ADMIN_ROLE, admin)

                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, admin)).is
                    .false
                expect(await mediator.hasRole(SYSTEM_ADMIN_ROLE, memberThree))
                    .is.true
            })

            it('DAO Admin is the role admin', async () => {
                expect(await mediator.getRoleAdmin(SYSTEM_ADMIN_ROLE)).equals(
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
    let mediator: BondMediator
    let curator: BondManager
    let creator: BondFactory
})
