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
    ERC20,
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
import {constants, Wallet} from 'ethers'
import {verifyOwnershipTransferredEventLogs} from './contracts/ownable/verify-ownable-event'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ExtendedERC20} from './contracts/cast/extended-erc20'
import {accessControlRevertMessage} from './contracts/bond/bond-access-control-messages'
import {createDaoEvents} from './contracts/bond/bond-portal-events'
import {events} from './framework/events'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero
const INVALID_DAO_ID = 0n

describe('Bond Mediator contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        nonWhitelistCollateralTokens = await deployContract<ERC20>(
            '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
            'Name',
            'SYMBOL'
        )
        curator = await deployContractWithProxy<BondManager>('BondManager')
        creator = await deployContractWithProxy<BondFactory>('BondFactory')
        mediator = await deployContractWithProxy<BondMediator>(
            'BondMediator',
            creator.address,
            curator.address
        )

        daoId = await createDao(mediator, treasury)
        await mediator.whitelistCollateral(daoId, collateralTokens.address)

        await curator.grantRole(BOND_AGGREGATOR.hex, mediator.address)
    })

    describe('collateral whitelist', () => {
        describe('add', () => {
            after(async () => {
                if (await mediator.paused()) {
                    await mediator.unpause()
                }
            })
            it('new token', async () => {
                const symbol = 'EEK'
                const tokens = await deployContract<ERC20PresetMinterPauser>(
                    'ERC20PresetMinterPauser',
                    'Another erc20 Token',
                    symbol
                )
                expect(await tokens.symbol()).equals(symbol)

                await mediator.whitelistCollateral(daoId, tokens.address)

                expect(await mediator.isCollateralWhitelisted(daoId, symbol)).is
                    .true
                expect(
                    await mediator.whitelistedCollateralAddress(daoId, symbol)
                ).equals(tokens.address)
            })

            it('cannot be an existing token', async () => {
                await expect(
                    mediator.whitelistCollateral(
                        daoId,
                        collateralTokens.address
                    )
                ).to.be.revertedWith('Whitelist: already present')
            })

            it('cannot have address zero', async () => {
                await expect(
                    mediator.whitelistCollateral(daoId, ADDRESS_ZERO)
                ).to.be.revertedWith('Whitelist: zero address')
            })

            it('cannot be a non-erc20 contract (without fallback)', async () => {
                const box = await deployContract<Box>('Box')

                await expect(
                    mediator.whitelistCollateral(daoId, box.address)
                ).to.be.revertedWith(
                    "function selector was not recognized and there's no fallback function"
                )
            })

            it('only bond admin', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .whitelistCollateral(daoId, collateralTokens.address)
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
                    mediator.whitelistCollateral(daoId, tokens.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('update', () => {
            after(async () => {
                if (await mediator.paused()) {
                    await mediator.unpause()
                }
            })
            it('cannot have identical value', async () => {
                await expect(
                    mediator.updateWhitelistedCollateral(
                        daoId,
                        collateralTokens.address
                    )
                ).to.be.revertedWith('Whitelist: identical address')
            })

            it('cannot have address zero', async () => {
                await expect(
                    mediator.updateWhitelistedCollateral(daoId, ADDRESS_ZERO)
                ).to.be.revertedWith('Whitelist: zero address')
            })

            it('cannot be a non-contract address', async () => {
                await expect(
                    mediator.updateWhitelistedCollateral(daoId, admin)
                ).to.be.revertedWith('function call to a non-contract account')
            })

            it('cannot be a non-erc20 contract (without fallback)', async () => {
                const box = await deployContract<Box>('Box')

                await expect(
                    mediator.updateWhitelistedCollateral(daoId, box.address)
                ).to.be.revertedWith(
                    "function selector was not recognized and there's no fallback function"
                )
            })

            it('only bond admin', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .updateWhitelistedCollateral(
                            daoId,
                            collateralTokens.address
                        )
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, BOND_ADMIN)
                )
            })

            it('existing address', async () => {
                const startingAddress =
                    await mediator.whitelistedCollateralAddress(
                        daoId,
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
                    daoId,
                    altCollateralTokens.address
                )

                const updatedAddress =
                    await mediator.whitelistedCollateralAddress(
                        daoId,
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
                    mediator.updateWhitelistedCollateral(daoId, tokens.address)
                ).to.be.revertedWith('Pausable: paused')
            })
        })

        describe('remove', () => {
            after(async () => {
                if (await mediator.paused()) {
                    await mediator.unpause()
                }
                if (
                    !(await mediator.isCollateralWhitelisted(
                        daoId,
                        collateralSymbol
                    ))
                ) {
                    await mediator.whitelistCollateral(
                        daoId,
                        collateralTokens.address
                    )
                }
            })
            it('entry', async () => {
                expect(
                    await mediator.isCollateralWhitelisted(
                        collateralTokens.address
                    )
                ).is.true
                expect(
                    await mediator.isCollateralWhitelisted(
                        daoId,
                        collateralSymbol
                    )
                ).is.true

                await mediator.removeWhitelistedCollateral(
                    collateralTokens.address
                )
                await mediator.removeWhitelistedCollateral(
                    daoId,
                    collateralSymbol
                )

                expect(
                    await mediator.isCollateralWhitelisted(
                        collateralTokens.address
                    )
                ).is.false
                expect(
                    await mediator.isCollateralWhitelisted(
                        daoId,
                        collateralSymbol
                    )
                ).is.false
            })

            it('non-existent entry', async () => {
                const absentAddress = Wallet.createRandom().address
                expect(await mediator.isCollateralWhitelisted(absentAddress)).is
                    .false
                const absentSymbol = 'A value not in the whitelist'
                expect(
                    await mediator.isCollateralWhitelisted(daoId, absentSymbol)
                ).is.false

                await expect(
                    mediator.removeWhitelistedCollateral(daoId, absentSymbol)
                    mediator.removeWhitelistedCollateral(absentAddress)
                ).to.be.revertedWith('Whitelist: not whitelisted')
            })

            it('only bond admin', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                         .removeWhitelistedCollateral(daoId, collateralSymbol)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                await expect(
                    mediator.removeWhitelistedCollateral(
                        collateralTokens.address
                    )
                    mediator.removeWhitelistedCollateral(daoId, symbol)
                ).to.be.revertedWith('Pausable: paused')
            })
        })
        describe('get all whitelist', () => {
            after(async () => {
                if (await mediator.paused()) {
                    await mediator.unpause()
                }
            })
            it('get all whitelisted collateral', async () => {
                expect((await mediator.whitelistSymbols()).length).to.equal(1)
                const exampleCollateralErc20 = await deployContract<ERC20>(
                    '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
                    'Name',
                    'SYMBOL1'
                )
                await successfulTransaction(
                    mediator.whitelistCollateral(exampleCollateralErc20.address)
                )
                const result: string[] = await mediator.whitelistSymbols()
                expect(result.length).to.equal(2)
                expect(result).to.deep.equal(['EEK', 'SYMBOL1'])
            })
        })
    })

    describe('managed bond', () => {
        after(async () => {
            if (await mediator.paused()) {
                await mediator.unpause()
            }
        })

            if (
                !(await mediator.isCollateralWhitelisted(
                    collateralTokens.address
                ))
            ) {
                await mediator.whitelistCollateral(collateralTokens.address)
            }
        })
        describe('create', () => {
            it('non-whitelisted collateral', async () => {
                await expect(
                    mediator.createManagedBond(
                        daoId,
                        'Named bond',
                        'AA00AA',
                        101n,
                        nonWhitelistCollateralTokens.address,
                        0n,
                        0n,
                        ''
                    )
                ).to.be.revertedWith('BM: collateral not whitelisted')
            })

            it('invalid DAO id', async () => {
                await expect(
                    mediator.createManagedBond(
                        INVALID_DAO_ID,
                        'Named bond',
                        'AA00AA',
                        101n,
                        nonWhitelistCollateralTokens.address,
                        0n,
                        0n,
                        ''
                    )
                ).to.be.revertedWith('BM: invalid DAO Id')
            })

            it('only bond admin', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .createManagedBond(
                            daoId,
                            'Bond Name',
                            'Bond Symbol',
                            1n,
                            collateralTokens.address,
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

                await successfulTransaction(
                    mediator.whitelistCollateral(collateralTokens.address)
                )

                const receipt = await successfulTransaction(
                    mediator.createManagedBond(
                        daoId,
                        bondName,
                        bondSymbol,
                        debtTokens,
                        collateralTokens.address,
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
                        daoId,
                        'Bond Name',
                        'Bond Symbol',
                        1n,
                        collateralTokens.address,
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
                expect(await mediator.connect(nonAdmin).treasury(daoId)).equals(
                    treasury
                )
            })
        })

        describe('update', () => {
            after(async () => {
                if (await mediator.paused()) {
                    await mediator.unpause()
                }
            })
            afterEach(async () => {
                if ((await mediator.treasury(daoId)) !== treasury) {
                    await mediator.setDaoTreasury(daoId, treasury)
                }
            })

            it('only bond admin', async () => {
                await expect(
                    mediator.connect(nonAdmin).setDaoTreasury(daoId, treasury)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, BOND_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                await expect(
                    mediator.setDaoTreasury(daoId, treasury)
                ).to.be.revertedWith('Pausable: paused')
            })
        })
    })

    describe('unpause', () => {
        before(async () => {
            if (await mediator.paused()) {
                await mediator.unpause()
            }
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
    let nonWhitelistCollateralTokens: ExtendedERC20
    let mediator: BondMediator
    let curator: BondManager
    let creator: BondFactory
    let daoId: bigint
})

async function createDao(
    mediator: BondMediator,
    treasury: string
): Promise<bigint> {
    const receipt = await successfulTransaction(mediator.createDao(treasury))

    const creationEvents = createDaoEvents(events('CreateDao', receipt))

    expect(creationEvents).is.not.undefined
    expect(creationEvents).has.length(1)

    return creationEvents[0].id.toBigInt()
}
