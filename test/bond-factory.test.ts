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
    Box,
    ERC20,
    UpgradedVersion,
    Version
} from '../typechain'
import {
    deployContract,
    deployContractWithProxy,
    execute,
    signer,
    upgradeContract
} from './framework/contracts'
import {constants} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {verifyCreateBondEvent} from './contracts/bond/verify-bond-factory-events'
import {
    BOND_ADMIN_ROLE,
    DAO_ADMIN_ROLE,
    SYSTEM_ADMIN_ROLE
} from './contracts/roles'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero

describe('Bond Factory contract', () => {
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

    describe.only('proxy upgrade', () => {
        it('maintains version across upgrade', async () => {
            const originalVersion = await bonds.VERSION()
            await upgradeContract('BondFactory', bonds.address)
            const upgradedVersion = await bonds.VERSION()
            expect(originalVersion).to.equal(upgradedVersion)
            // dummyUpgradedBondFactory = await deployContract<UpgradedVersion>("UpgradedVersion")
            await upgradeContract('UpgradedVersion', bonds.address)
            expect(await bonds.VERSION()).to.equal('v0.0.6-beta.3')
        })
    })

    describe('access control', () => {
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

    describe('create bond', () => {
        it('non-whitelisted collateral', async () => {
            await expect(
                bonds.createBond(
                    'Named bond',
                    'AA00AA',
                    101n,
                    'BEEP',
                    0n,
                    0n,
                    ''
                )
            ).to.be.revertedWith('BF: collateral not whitelisted')
        })

        it('whitelisted (BIT) collateral', async () => {
            const bondName = 'Special Debt Certificate'
            const bondSymbol = 'SDC001'
            const debtTokenAmount = 555666777n
            const collateralSymbol = 'BIT'
            const expiryTimestamp = 560000n
            const minimumDeposit = 100n
            const data = 'a random;delimiter;separated string'

            const receipt = await execute(
                bonds.createBond(
                    bondName,
                    bondSymbol,
                    debtTokenAmount,
                    collateralSymbol,
                    expiryTimestamp,
                    minimumDeposit,
                    data
                )
            )

            await verifyCreateBondEvent(
                {
                    name: bondName,
                    debtSymbol: bondSymbol,
                    debtAmount: debtTokenAmount,
                    creator: admin,
                    treasury: treasury,
                    expiryTimestamp: expiryTimestamp,
                    data: data
                },
                receipt
            )
        })
    })

    describe('collateral whitelist', () => {
        describe('add', () => {
            it('new token', async () => {
                const symbol = 'EEK'
                const tokens = await deployContract<ERC20>(
                    'ERC20',
                    'Another erc20 Token',
                    symbol
                )
                expect(await tokens.symbol()).equals(symbol)

                await bonds.whitelistCollateral(tokens.address)

                expect(await bonds.isCollateralWhitelisted(symbol)).is.true
                expect(await bonds.whitelistedCollateralAddress(symbol)).equals(
                    tokens.address
                )
            })

            it('cannot be an existing token', async () => {
                await expect(
                    bonds.whitelistCollateral(collateralTokens.address)
                ).to.be.revertedWith('Whitelist: already present')
            })

            it('cannot have address zero', async () => {
                await expect(
                    bonds.whitelistCollateral(ADDRESS_ZERO)
                ).to.be.revertedWith('Whitelist: zero address')
            })

            it('cannot be a non-erc20 contract (without fallback)', async () => {
                const box = await deployContract<Box>('Box')

                await expect(
                    bonds.whitelistCollateral(box.address)
                ).to.be.revertedWith(
                    "function selector was not recognized and there's no fallback function"
                )
            })

            it('only bond admin', async () => {
                await expect(
                    bonds
                        .connect(nonAdmin)
                        .whitelistCollateral(collateralTokens.address)
                ).to.be.revertedWith(
                    'AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
                )
            })
        })

        describe('update', () => {
            it('cannot have identical value', async () => {
                await expect(
                    bonds.updateWhitelistedCollateral(collateralTokens.address)
                ).to.be.revertedWith('Whitelist: identical address')
            })

            it('cannot have address zero', async () => {
                await expect(
                    bonds.updateWhitelistedCollateral(ADDRESS_ZERO)
                ).to.be.revertedWith('Whitelist: zero address')
            })

            it('cannot be a non-contract address', async () => {
                await expect(
                    bonds.updateWhitelistedCollateral(admin)
                ).to.be.revertedWith('function call to a non-contract account')
            })

            it('cannot be a non-erc20 contract (without fallback)', async () => {
                const box = await deployContract<Box>('Box')

                await expect(
                    bonds.updateWhitelistedCollateral(box.address)
                ).to.be.revertedWith(
                    "function selector was not recognized and there's no fallback function"
                )
            })

            it('only bond admin', async () => {
                await expect(
                    bonds
                        .connect(nonAdmin)
                        .updateWhitelistedCollateral(collateralTokens.address)
                ).to.be.revertedWith(
                    'AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
                )
            })

            it('existing address', async () => {
                const startingAddress =
                    await bonds.whitelistedCollateralAddress(collateralSymbol)
                expect(startingAddress).equals(collateralTokens.address)
                const altCollateralTokens = await deployContract<BitDAO>(
                    'BitDAO',
                    admin
                )
                expect(await altCollateralTokens.symbol()).equals(
                    collateralSymbol
                )
                expect(altCollateralTokens.address).not.equals(startingAddress)

                await bonds.updateWhitelistedCollateral(
                    altCollateralTokens.address
                )

                const updatedAddress = await bonds.whitelistedCollateralAddress(
                    collateralSymbol
                )
                expect(updatedAddress).not.equals(startingAddress)
            })
        })

        describe('remove', () => {
            it('entry', async () => {
                expect(await bonds.isCollateralWhitelisted(collateralSymbol)).is
                    .true

                await bonds.removeWhitelistedCollateral(collateralSymbol)

                expect(await bonds.isCollateralWhitelisted(collateralSymbol)).is
                    .false
            })

            it('non-existent entry', async () => {
                const absentSymbol = 'A value not in the whitelist'
                expect(await bonds.isCollateralWhitelisted(absentSymbol)).is
                    .false

                await expect(
                    bonds.removeWhitelistedCollateral(absentSymbol)
                ).to.be.revertedWith('Whitelist: not whitelisted')
            })

            it('only bond admin', async () => {
                await expect(
                    bonds
                        .connect(nonAdmin)
                        .removeWhitelistedCollateral(collateralSymbol)
                ).to.be.revertedWith(
                    'AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
                )
            })
        })
    })

    describe('treasury', () => {
        describe('retrieve', () => {
            it(' by non-owner', async () => {
                expect(await bonds.connect(nonAdmin).treasury()).equals(
                    treasury
                )
            })
        })

        describe('update', () => {
            beforeEach(async () => {
                if ((await bonds.treasury()) !== treasury) {
                    await bonds.setTreasury(treasury)
                }
            })

            it('to a valid address', async () => {
                expect(await bonds.treasury()).equals(treasury)

                await bonds.setTreasury(nonAdmin.address)

                expect(await bonds.treasury()).equals(nonAdmin.address)
            })

            it('cannot be identical', async () => {
                expect(await bonds.treasury()).equals(treasury)

                await expect(bonds.setTreasury(treasury)).to.be.revertedWith(
                    'BF: treasury address identical'
                )
            })

            it('cannot be zero', async () => {
                await expect(
                    bonds.setTreasury(ADDRESS_ZERO)
                ).to.be.revertedWith('BF: treasury is zero address')
            })

            it('only bond admin', async () => {
                await expect(
                    bonds.connect(nonAdmin).setTreasury(treasury)
                ).to.be.revertedWith(
                    'AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x424f4e445f41444d494e00000000000000000000000000000000000000000000'
                )
            })
        })
    })

    let admin: string
    let treasury: string
    let memberOne: string
    let memberTwo: string
    let memberThree: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ERC20
    let collateralSymbol: string
    let bonds: BondFactory
    let dummyUpgradedBondFactory: UpgradedVersion
})
