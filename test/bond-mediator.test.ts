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
    Box,
    ERC20PresetMinterPauser
} from '../typechain-types'
import {
    deployContract,
    deployContractWithProxy,
    signer
} from './framework/contracts'
import {BOND_ADMIN, BOND_AGGREGATOR} from './contracts/bond/roles'
import {successfulTransaction} from './framework/transaction'
import {addBondEventLogs} from './contracts/bond/bond-curator-events'
import {eventLog} from './framework/event-logs'
import {erc20SingleCollateralBondContractAt} from './contracts/bond/single-collateral-bond-contract'
import {constants} from 'ethers'
import {verifyOwnershipTransferredEventLogs} from './contracts/ownable/verify-ownable-event'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ExtendedERC20} from './contracts/cast/extended-erc20'
import {accessControlRevertMessage} from './contracts/bond/bond-access-control-messages'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero

describe('Bond Mediator contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        collateralSymbol = await collateralTokens.symbol()
        curator = await deployContractWithProxy<BondManager>('BondManager')
        creator = await deployContractWithProxy<BondFactory>('BondFactory')
        mediator = await deployContractWithProxy<BondMediator>(
            'BondMediator',
            creator.address,
            curator.address,
            treasury,
            collateralTokens.address
        )

        await curator.grantRole(BOND_AGGREGATOR.hex, mediator.address)
    })

    describe('collateral whitelist', () => {
        describe('add', () => {
            it('new token', async () => {
                const symbol = 'EEK'
                const tokens = await deployContract<ERC20PresetMinterPauser>(
                    'ERC20PresetMinterPauser',
                    'Another erc20 Token',
                    symbol
                )
                expect(await tokens.symbol()).equals(symbol)

                await mediator.whitelistCollateral(tokens.address)

                expect(await mediator.isCollateralWhitelisted(symbol)).is.true
                expect(
                    await mediator.whitelistedCollateralAddress(symbol)
                ).equals(tokens.address)
            })

            it('cannot be an existing token', async () => {
                await expect(
                    mediator.whitelistCollateral(collateralTokens.address)
                ).to.be.revertedWith('Whitelist: already present')
            })

            it('cannot have address zero', async () => {
                await expect(
                    mediator.whitelistCollateral(ADDRESS_ZERO)
                ).to.be.revertedWith('Whitelist: zero address')
            })

            it('cannot be a non-erc20 contract (without fallback)', async () => {
                const box = await deployContract<Box>('Box')

                await expect(
                    mediator.whitelistCollateral(box.address)
                ).to.be.revertedWith(
                    "function selector was not recognized and there's no fallback function"
                )
            })

            it('only bond admin', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .whitelistCollateral(collateralTokens.address)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                const symbol = 'EEK'
                const tokens = await deployContract<ERC20PresetMinterPauser>(
                    'ERC20PresetMinterPauser',
                    'Another erc20 Token',
                    symbol
                )
                expect(await tokens.symbol()).equals(symbol)

                await expect(
                    mediator.whitelistCollateral(tokens.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('update', () => {
            before(async () => {
                await mediator.unpause()
            })
            it('cannot have identical value', async () => {
                await expect(
                    mediator.updateWhitelistedCollateral(
                        collateralTokens.address
                    )
                ).to.be.revertedWith('Whitelist: identical address')
            })

            it('cannot have address zero', async () => {
                await expect(
                    mediator.updateWhitelistedCollateral(ADDRESS_ZERO)
                ).to.be.revertedWith('Whitelist: zero address')
            })

            it('cannot be a non-contract address', async () => {
                await expect(
                    mediator.updateWhitelistedCollateral(admin)
                ).to.be.revertedWith('function call to a non-contract account')
            })

            it('cannot be a non-erc20 contract (without fallback)', async () => {
                const box = await deployContract<Box>('Box')

                await expect(
                    mediator.updateWhitelistedCollateral(box.address)
                ).to.be.revertedWith(
                    "function selector was not recognized and there's no fallback function"
                )
            })

            it('only bond admin', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .updateWhitelistedCollateral(collateralTokens.address)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, BOND_ADMIN)
                )
            })

            it('existing address', async () => {
                const startingAddress =
                    await mediator.whitelistedCollateralAddress(
                        collateralSymbol
                    )
                expect(startingAddress).equals(collateralTokens.address)
                const altCollateralTokens = await deployContract<BitDAO>(
                    'BitDAO',
                    admin
                )
                expect(await altCollateralTokens.symbol()).equals(
                    collateralSymbol
                )
                expect(altCollateralTokens.address).not.equals(startingAddress)

                await mediator.updateWhitelistedCollateral(
                    altCollateralTokens.address
                )

                const updatedAddress =
                    await mediator.whitelistedCollateralAddress(
                        collateralSymbol
                    )
                expect(updatedAddress).not.equals(startingAddress)
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                const symbol = 'EEK'
                const tokens = await deployContract<ERC20PresetMinterPauser>(
                    'ERC20PresetMinterPauser',
                    'Another erc20 Token',
                    symbol
                )
                expect(await tokens.symbol()).equals(symbol)

                await expect(
                    mediator.updateWhitelistedCollateral(tokens.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('remove', () => {
            before(async () => {
                await mediator.unpause()
            })
            it('entry', async () => {
                expect(await mediator.isCollateralWhitelisted(collateralSymbol))
                    .is.true

                await mediator.removeWhitelistedCollateral(collateralSymbol)

                expect(await mediator.isCollateralWhitelisted(collateralSymbol))
                    .is.false
            })

            it('non-existent entry', async () => {
                const absentSymbol = 'A value not in the whitelist'
                expect(await mediator.isCollateralWhitelisted(absentSymbol)).is
                    .false

                await expect(
                    mediator.removeWhitelistedCollateral(absentSymbol)
                ).to.be.revertedWith('Whitelist: not whitelisted')
            })

            it('only bond admin', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .removeWhitelistedCollateral(collateralSymbol)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                const symbol = 'EEK'
                await expect(
                    mediator.removeWhitelistedCollateral(symbol)
                ).to.be.revertedWith('Pausable: paused')
            })
        })
    })

    describe('managed bond', () => {
        before(async () => {
            if (await mediator.paused()) {
                await mediator.unpause()
            }

            if (!(await mediator.isCollateralWhitelisted(collateralSymbol))) {
                await mediator.whitelistCollateral(collateralTokens.address)
            }
        })
        describe('create', () => {
            it('non-whitelisted collateral', async () => {
                await expect(
                    mediator.createManagedBond(
                        'Named bond',
                        'AA00AA',
                        101n,
                        'Not Whitelisted',
                        0n,
                        0n,
                        ''
                    )
                ).to.be.revertedWith('BM: collateral not whitelisted')
            })

            it('only bond admin', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .createManagedBond(
                            'Bond Name',
                            'Bond Symbol',
                            1n,
                            'Collateral Symbol',
                            0n,
                            100n,
                            ''
                        )
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, BOND_ADMIN)
                )
            })

            it('whitelisted collateral', async () => {
                const bondName = 'A highly unique bond name'
                const bondSymbol = 'Bond Symbol'
                const debtTokens = 101n
                const expiryTimestamp = 9999n
                const minimumDeposit = 1n
                const metaData = 'meh'

                const receipt = await successfulTransaction(
                    mediator.createManagedBond(
                        bondName,
                        bondSymbol,
                        debtTokens,
                        collateralSymbol,
                        expiryTimestamp,
                        minimumDeposit,
                        metaData
                    )
                )

                const addBondEvents = addBondEventLogs(
                    eventLog('AddBond', curator, receipt)
                )
                expect(addBondEvents.length).to.equal(1)

                const createdBondAddress = addBondEvents[0].bond
                expect(await curator.bondCount()).equals(1)
                expect(await curator.bondAt(0)).equals(createdBondAddress)

                const bond = await erc20SingleCollateralBondContractAt(
                    createdBondAddress
                )

                verifyOwnershipTransferredEventLogs(
                    [
                        {
                            previousOwner: constants.AddressZero,
                            newOwner: creator.address
                        },
                        {
                            previousOwner: creator.address,
                            newOwner: mediator.address
                        },
                        {
                            previousOwner: mediator.address,
                            newOwner: curator.address
                        }
                    ],
                    bond,
                    receipt
                )

                expect(await bond.name()).equals(bondName)
                expect(await bond.symbol()).equals(bondSymbol)
                expect(await bond.debtTokens()).equals(debtTokens)
                expect(await bond.collateralTokens()).equals(
                    collateralTokens.address
                )
                expect(await bond.expiryTimestamp()).equals(expiryTimestamp)
                expect(await bond.minimumDeposit()).equals(minimumDeposit)
                expect(await bond.metaData()).equals(metaData)
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                await expect(
                    mediator.createManagedBond(
                        'Bond Name',
                        'Bond Symbol',
                        1n,
                        'Collateral Symbol',
                        0n,
                        100n,
                        ''
                    )
                ).to.be.revertedWith('Pausable: paused')
            })
        })
    })

    describe('treasury', () => {
        describe('retrieve', () => {
            it(' by non-owner', async () => {
                expect(await mediator.connect(nonAdmin).treasury()).equals(
                    treasury
                )
            })
        })

        describe('update', () => {
            before(async () => {
                await mediator.unpause()
            })
            beforeEach(async () => {
                if ((await mediator.treasury()) !== treasury) {
                    await mediator.setTreasury(treasury)
                }
            })

            it('to a valid address', async () => {
                expect(await mediator.treasury()).equals(treasury)

                await mediator.setTreasury(nonAdmin.address)

                expect(await mediator.treasury()).equals(nonAdmin.address)
            })

            it('cannot be identical', async () => {
                expect(await mediator.treasury()).equals(treasury)

                await expect(mediator.setTreasury(treasury)).to.be.revertedWith(
                    'BM: identical treasury address'
                )
            })

            it('cannot be zero', async () => {
                await expect(
                    mediator.setTreasury(ADDRESS_ZERO)
                ).to.be.revertedWith('BM: treasury address is zero')
            })

            it('only bond admin', async () => {
                await expect(
                    mediator.connect(nonAdmin).setTreasury(treasury)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                await expect(mediator.setTreasury(treasury)).to.be.revertedWith(
                    'Pausable: paused'
                )
            })
        })
    })

    describe('unpause', () => {
        before(async () => {
            await mediator.unpause()
        })

        it('changes state', async () => {
            await mediator.pause()

            expect(await mediator.paused()).is.true

            await mediator.unpause()

            expect(await mediator.paused()).is.false
        })

        it('only bond admin', async () => {
            await expect(mediator.connect(nonAdmin).pause()).to.be.revertedWith(
                accessControlRevertMessage(nonAdmin, BOND_ADMIN)
            )
        })

        it('only when paused', async () => {
            await expect(mediator.unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })
    })

    let admin: string
    let treasury: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ExtendedERC20
    let collateralSymbol: string
    let mediator: BondMediator
    let curator: BondManager
    let creator: BondFactory
})
