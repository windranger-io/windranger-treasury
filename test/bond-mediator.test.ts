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
    BondMediator,
    ERC20,
    ERC20PresetMinterPauser
} from '../typechain-types'
import {
    deployContract,
    deployContractWithProxy,
    signer
} from './framework/contracts'
import {DAO_ADMIN} from './contracts/bond/roles'
import {successfulTransaction} from './framework/transaction'
import {eventLog} from './framework/event-logs'
import {erc20SingleCollateralBondContractAt} from './contracts/bond/single-collateral-bond-contract'
import {constants} from 'ethers'
import {verifyOwnershipTransferredEventLogs} from './contracts/ownable/verify-ownable-event'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ExtendedERC20} from './contracts/cast/extended-erc20'
import {accessControlRevertMessage} from './contracts/bond/bond-access-control-messages'
import {createDaoEvents} from './contracts/bond/bond-portal-events'
import {events} from './framework/events'
import {createBondEventLogs} from './contracts/bond/bond-creator-events'

// Wires up Waffle with Chai
chai.use(solidity)

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
        creator = await deployContractWithProxy<BondFactory>('BondFactory')
        mediator = await deployContractWithProxy<BondMediator>(
            'BondMediator',
            creator.address
        )

        daoId = await createDao(mediator, treasury)
        await mediator.whitelistCollateral(daoId, collateralTokens.address)
    })

    describe('collateral whitelist', () => {
        describe('add', () => {
            after(async () => {
                if (await mediator.paused()) {
                    await mediator.unpause()
                }
            })
            it('only bond admin', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .whitelistCollateral(daoId, collateralTokens.address)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, DAO_ADMIN)
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

        describe('remove', () => {
            after(async () => {
                if (await mediator.paused()) {
                    await mediator.unpause()
                }
                if (
                    !(await mediator.isAllowedDaoCollateral(
                        daoId,
                        collateralTokens.address
                    ))
                ) {
                    await mediator.whitelistCollateral(
                        daoId,
                        collateralTokens.address
                    )
                }
            })

            it('only bond admin', async () => {
                await expect(
                    mediator
                        .connect(nonAdmin)
                        .removeWhitelistedCollateral(
                            daoId,
                            collateralTokens.address
                        )
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, DAO_ADMIN)
                )
            })

            it('only when not paused', async () => {
                await successfulTransaction(mediator.pause())
                expect(await mediator.paused()).is.true
                await expect(
                    mediator.removeWhitelistedCollateral(
                        daoId,
                        collateralTokens.address
                    )
                ).to.be.revertedWith('Pausable: paused')
            })
        })
    })

    describe('managed bond', () => {
        after(async () => {
            if (await mediator.paused()) {
                await mediator.unpause()
            }
        })
        describe('create', () => {
            it('non-whitelisted collateral', async () => {
                await expect(
                    mediator.createManagedBond(
                        daoId,
                        {
                            name: 'Named bond',
                            symbol: 'AA00AA',
                            data: ''
                        },
                        {
                            collateralTokens:
                                nonWhitelistCollateralTokens.address,
                            debtTokenAmount: 101n,
                            expiryTimestamp: 0n,
                            minimumDeposit: 0n
                        }
                    )
                ).to.be.revertedWith('BM: collateral not whitelisted')
            })

            it('invalid DAO id', async () => {
                await expect(
                    mediator.createManagedBond(
                        INVALID_DAO_ID,
                        {
                            name: 'Named bond',
                            symbol: 'AA00AA',
                            data: ''
                        },
                        {
                            collateralTokens:
                                nonWhitelistCollateralTokens.address,
                            debtTokenAmount: 201n,
                            expiryTimestamp: 0n,
                            minimumDeposit: 0n
                        }
                    )
                ).to.be.revertedWith('BM: invalid DAO Id')
            })

            it('only bond admin', async () => {
                await expect(
                    mediator.connect(nonAdmin).createManagedBond(
                        daoId,
                        {
                            name: 'Named bond',
                            symbol: 'Bond Symbol',
                            data: ''
                        },
                        {
                            collateralTokens: collateralTokens.address,
                            debtTokenAmount: 1n,
                            expiryTimestamp: 0n,
                            minimumDeposit: 100n
                        }
                    )
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, DAO_ADMIN)
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
                        daoId,
                        {
                            name: bondName,
                            symbol: bondSymbol,
                            data: metaData
                        },
                        {
                            collateralTokens: collateralTokens.address,
                            debtTokenAmount: debtTokens,
                            expiryTimestamp: expiryTimestamp,
                            minimumDeposit: minimumDeposit
                        }
                    )
                )

                const createBondEvents = createBondEventLogs(
                    eventLog('CreateBond', creator, receipt)
                )
                expect(createBondEvents.length).to.equal(1)

                const createdBondAddress = createBondEvents[0].bond
                expect(await mediator.bondCount(daoId)).equals(1)
                expect(await mediator.bondAt(daoId, 0)).equals(
                    createdBondAddress
                )

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
                        {
                            name: 'Named bond',
                            symbol: 'Bond Symbol',
                            data: ''
                        },
                        {
                            collateralTokens: collateralTokens.address,
                            debtTokenAmount: 5n,
                            expiryTimestamp: 2n,
                            minimumDeposit: 70n
                        }
                    )
                ).to.be.revertedWith('Pausable: paused')
            })
        })
    })

    describe('treasury', () => {
        describe('retrieve', () => {
            it(' by non-owner', async () => {
                expect(
                    await mediator.connect(nonAdmin).daoTreasury(daoId)
                ).equals(treasury)
            })
        })

        describe('update', () => {
            after(async () => {
                if (await mediator.paused()) {
                    await mediator.unpause()
                }
            })

            it('only bond admin', async () => {
                await expect(
                    mediator.connect(nonAdmin).setDaoTreasury(daoId, treasury)
                ).to.be.revertedWith(
                    accessControlRevertMessage(nonAdmin, DAO_ADMIN)
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
                accessControlRevertMessage(nonAdmin, DAO_ADMIN)
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
