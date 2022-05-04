// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    BitDAO,
    ERC20,
    ERC20SingleCollateralBondBox,
    IERC20
} from '../../../typechain-types'
import {deployContract, signer} from '../../framework/contracts'
import {BigNumberish, ContractReceipt, constants, ethers} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from '../../framework/transaction'
import {
    verifyAllowRedemptionEvents,
    verifyAllowRedemptionLogEvents,
    verifyDebtIssueEventLogs,
    verifyDebtIssueEvents,
    verifyDepositEventLogs,
    verifyDepositEvents,
    verifyExpireEventLogs,
    verifyExpireEvents,
    verifyFullCollateralEventLogs,
    verifyFullCollateralEvents,
    verifyPartialCollateralEvent,
    verifyRedemptionEvent,
    verifySlashDepositsEvent,
    verifyWithdrawCollateralEvent
} from '../../event/bond/verify-single-collateral-bond-events'
import {verifyERC20TransferEvents} from '../../event/erc20/verify-erc20-events'
import {
    ExpectedMetaDataUpdateEvent,
    verifyMetaDataUpdateEvents,
    verifyMetaDataUpdateLogEvents
} from '../../event/bond/verify-meta-data-store-events'
import {
    ExpectedRedeemableUpdateEvent,
    verifyRedeemableEvents,
    verifyRedeemableUpdateLogEvents
} from '../../event/bond/verify-redeemable-events'
import {
    verifyBeneficiaryUpdateEvents,
    verifyBeneficiaryUpdateLogEvents
} from '../../event/sweep/verify-token-sweep-events'
import {
    ExpectedERC20SweepEvent,
    verifyERC20SweepEvents,
    verifyERC20SweepLogEvents
} from '../../event/sweep/verify-sweep-erc20-events'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero
const ZERO = 0n
const ONE = 1n
const ONE_DAY_MS = 1000 * 60 * 60 * 24
const FORTY_PERCENT = 40n
const FIFTY_PERCENT = 50n
const DATA = 'performance factors;assessment date;rewards pool'
const BOND_EXPIRY = 750000n
const MINIMUM_DEPOSIT = 100n
const REDEMPTION_REASON = 'test reason string'
const BOND_SLASH_REASON = 'example slash reason'

describe('ERC20 Single Collateral Bond contract', () => {
    before(async () => {
        admin = await signer(0)
        treasury = (await signer(1)).address
        guarantorOne = await signer(2)
        guarantorTwo = await signer(3)
        guarantorThree = await signer(4)
    })

    beforeEach(async () => {
        collateralTokens = (await deployContract<BitDAO>(
            'BitDAO',
            admin.address
        )) as ERC20
    })

    describe('allow redemption', () => {
        it('changes state', async () => {
            bond = await createBond(ONE)
            expect(await bond.redeemable()).is.false

            await bond.allowRedemption(REDEMPTION_REASON)
            expect(await bond.redeemable()).is.true
            expect(await bond.redemptionReason()).to.equal(REDEMPTION_REASON)
        })

        it('only when not paused', async () => {
            bond = await createBond(ONE)
            await bond.pause()

            await expect(
                bond.allowRedemption(REDEMPTION_REASON)
            ).to.be.revertedWith('Pausable: paused')
        })

        it('only when not redeemable', async () => {
            bond = await createBond(ONE)
            await bond.allowRedemption(REDEMPTION_REASON)

            await expect(
                bond.allowRedemption(REDEMPTION_REASON)
            ).to.be.revertedWith('whenNotRedeemable: redeemable')
        })

        it('only owner', async () => {
            bond = await createBond(ONE)

            await expect(
                bond.connect(guarantorOne).allowRedemption(REDEMPTION_REASON)
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe('collateral', () => {
        it('increases on deposit', async () => {
            const pledgeOne = 998877n
            const pledgeTwo = 99n
            const totalPledge = pledgeOne + pledgeTwo
            bond = await createBond(totalPledge)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: totalPledge}
            ])
            expect(await bond.collateral()).equals(ZERO)

            await depositBond(guarantorOne, pledgeOne)

            expect(await bond.collateral()).equals(pledgeOne)

            await depositBond(guarantorOne, pledgeTwo)

            expect(await bond.collateral()).equals(totalPledge)
            expect(await bond.collateralSlashed()).equals(ZERO)
        })

        it('decreases on redemption', async () => {
            const redemptionOne = 400n
            const redemptionTwo = 5000n
            const pledge = redemptionOne + redemptionTwo + 50n
            bond = await createBond(pledge)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await bond.allowRedemption(REDEMPTION_REASON)
            expect(await bond.collateral()).equals(pledge)

            await redeem(guarantorOne, redemptionOne)

            expect(await bond.collateral()).equals(pledge - redemptionOne)

            await redeem(guarantorOne, redemptionTwo)

            expect(await bond.collateral()).equals(
                pledge - redemptionOne - redemptionTwo
            )
            expect(await bond.collateralSlashed()).equals(ZERO)
        })
    })

    describe('collateral slashed', () => {
        const slashOne = 9000n
        const slashTwo = 44300n
        it('increases', async () => {
            const pledge = slashOne + slashTwo + 675n
            bond = await createBond(pledge)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            expect(await bond.collateralSlashed()).equals(ZERO)

            await slashCollateral(slashOne, BOND_SLASH_REASON)

            expect(await bond.collateralSlashed()).equals(slashOne)

            await slashCollateral(slashTwo, BOND_SLASH_REASON)

            expect(await bond.collateralSlashed()).equals(slashOne + slashTwo)
            expect(await bond.collateral()).equals(pledge - slashOne - slashTwo)
        })
        it('get all slash reasons', async () => {
            const slashReasons = await bond.getSlashes()
            expect(slashReasons).to.be.length(2)
            expect(slashReasons[0].reason).to.equal(BOND_SLASH_REASON)
            expect(slashReasons[0].collateralAmount).to.equal(slashOne)
            expect(slashReasons[1].reason).to.equal(BOND_SLASH_REASON)
            expect(slashReasons[1].collateralAmount).to.equal(slashTwo)
        })
        it('get first slash reason', async () => {
            const slashReason = await bond.getSlashByIndex(0)
            expect(slashReason.reason).to.equal(BOND_SLASH_REASON)
            expect(slashReason.collateralAmount).to.equal(slashOne)
        })
        it('out of bounds slash reason', async () => {
            await expect(bond.getSlashByIndex(2)).to.be.revertedWith(
                'Bond: slash does not exist'
            )
        })
    })

    describe('debt tokens', () => {
        it('initial supply', async () => {
            const initialSupply = 97500n
            bond = await createBond(initialSupply)

            expect(await bond.debtTokens()).equals(initialSupply)
        })

        it('decreases on deposit', async () => {
            const initialSupply = 97500n
            const pledgeOne = 500n
            const pledgeTwo = 7500n
            const pledgeTotal = pledgeOne + pledgeTwo
            bond = await createBond(initialSupply)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledgeTotal}
            ])
            expect(await bond.debtTokens()).equals(initialSupply)

            await depositBond(guarantorOne, pledgeOne)

            expect(await bond.debtTokens()).equals(initialSupply - pledgeOne)

            await depositBond(guarantorOne, pledgeTwo)

            expect(await bond.debtTokens()).equals(initialSupply - pledgeTotal)
        })

        it('unaffected by redemption', async () => {
            const initialSupply = 9500n
            const pledge = 300n
            bond = await createBond(initialSupply)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await bond.allowRedemption(REDEMPTION_REASON)
            expect(await bond.debtTokens()).equals(initialSupply - pledge)

            await redeem(guarantorOne, pledge)

            expect(await bond.debtTokens()).equals(initialSupply - pledge)
        })
    })

    describe('debt tokens outstanding', () => {
        it('increases on deposit', async () => {
            const initialSupply = 97500n
            const pledgeOne = 500n
            const pledgeTwo = 7500n
            const pledgeTotal = pledgeOne + pledgeTwo
            bond = await createBond(initialSupply)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledgeTotal}
            ])
            expect(await bond.debtTokensOutstanding()).equals(ZERO)

            await depositBond(guarantorOne, pledgeOne)

            expect(await bond.debtTokensOutstanding()).equals(pledgeOne)

            await depositBond(guarantorOne, pledgeTwo)

            expect(await bond.debtTokensOutstanding()).equals(pledgeTotal)
        })

        it('decreases on redemption', async () => {
            const initialSupply = 97500n
            const pledgeOne = 500n
            const pledgeTwo = 7500n
            const pledgeTotal = pledgeOne + pledgeTwo
            bond = await createBond(initialSupply)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledgeTotal}
            ])
            await depositBond(guarantorOne, pledgeOne)
            await depositBond(guarantorOne, pledgeTwo)
            await allowRedemption(REDEMPTION_REASON)
            expect(await bond.debtTokensOutstanding()).equals(pledgeTotal)

            await redeem(guarantorOne, pledgeOne)

            expect(await bond.debtTokensOutstanding()).equals(
                pledgeTotal - pledgeOne
            )

            await redeem(guarantorOne, pledgeTwo)

            expect(await bond.debtTokensOutstanding()).equals(ZERO)
        })
    })

    describe('deposit', () => {
        it('cannot be zero', async () => {
            bond = await createBond(5566777n)

            await expect(bond.deposit(ZERO)).to.be.revertedWith(
                'Bond: too small'
            )
        })

        it('cannot be greater than available Debt Tokens', async () => {
            const debtTokens = 500000n
            bond = await createBond(debtTokens)

            await expect(bond.deposit(debtTokens + 1n)).to.be.revertedWith(
                'Bond: too large'
            )
        })

        it('cannot be below minimum deposit', async () => {
            const belowMinimum = MINIMUM_DEPOSIT - 1n
            bond = await createBond(5566777n)

            await expect(bond.deposit(belowMinimum)).to.be.revertedWith(
                'Bond: below minimum'
            )
        })

        it('only when not paused', async () => {
            const pledge = 60n
            bond = await createBond(pledge)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await bond.pause()

            await expect(
                bond.connect(guarantorOne).deposit(pledge)
            ).to.be.revertedWith('Pausable: paused')
        })

        it('only when not redeemable', async () => {
            const pledge = 60n
            bond = await createBond(235666777n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await allowRedemption(REDEMPTION_REASON)

            await expect(
                bond.connect(guarantorOne).deposit(pledge)
            ).to.be.revertedWith('whenNotRedeemable: redeemable')
        })

        it('with full collateral', async () => {
            const pledge = 5040n
            bond = await createBond(pledge)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            expect(await bond.hasFullCollateral()).equals(false)

            await depositBond(guarantorOne, pledge)

            expect(await bond.hasFullCollateral()).equals(true)
        })
    })

    describe('expire', () => {
        it('when called by non-owner', async () => {
            const pledge = 445n
            bond = await createBond(pledge)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            expect(await bond.paused()).is.false

            await bond.connect(guarantorOne).expire()

            await verifyBalances([
                {address: bond.address, bond: ZERO, collateral: ZERO},
                {address: guarantorOne, bond: pledge, collateral: ZERO},
                {address: treasury, bond: ZERO, collateral: pledge}
            ])
            expect(await bond.paused()).is.true
        })

        it('during redemption', async () => {
            const pledge = 9899n
            bond = await createBond(pledge)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await bond.allowRedemption(REDEMPTION_REASON)
            expect(await bond.paused()).is.false
            expect(await bond.redeemable()).is.true

            await bond.expire()

            await verifyBalances([
                {address: bond.address, bond: ZERO, collateral: ZERO},
                {address: guarantorOne, bond: pledge, collateral: ZERO},
                {address: treasury, bond: ZERO, collateral: pledge}
            ])
            expect(await bond.paused()).is.true
            expect(await bond.redeemable()).is.true
        })

        it('when paused', async () => {
            const pledge = 667777n
            bond = await createBond(pledge)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await bond.pause()
            expect(await bond.paused()).is.true

            await bond.connect(guarantorOne).expire()

            await verifyBalances([
                {address: bond.address, bond: ZERO, collateral: ZERO},
                {address: guarantorOne, bond: pledge, collateral: ZERO},
                {address: treasury, bond: ZERO, collateral: pledge}
            ])
            expect(await bond.paused()).is.true
        })

        it('only when there is collateral to move', async () => {
            bond = await createBond(500n)

            await expect(
                bond.connect(guarantorOne).expire()
            ).to.be.revertedWith('Bond: no collateral remains')
        })

        it('only after expiry', async () => {
            bond = await deployContract('ERC20SingleCollateralBondBox')
            expect(ethers.utils.isAddress(bond.address)).is.true

            await bond.initialize(
                {
                    name: 'Special Debt Certificate',
                    symbol: 'SDC001',
                    data: DATA
                },
                {
                    debtTokenAmount: 500n,
                    collateralTokens: collateralTokens.address,
                    expiryTimestamp: Date.now() + ONE_DAY_MS,
                    minimumDeposit: MINIMUM_DEPOSIT
                },
                treasury
            )

            await expect(bond.expire()).to.be.revertedWith(
                'ExpiryTimestamp: not yet expired'
            )
        })
    })

    describe('init', () => {
        it('can only call once', async () => {
            bond = await createBond(ONE)

            await expect(
                bond.initialize(
                    {
                        name: 'MDT002',
                        data: DATA,
                        symbol: 'My Debt Tokens two'
                    },
                    {
                        debtTokenAmount: ONE,
                        collateralTokens: collateralTokens.address,
                        expiryTimestamp: BOND_EXPIRY,
                        minimumDeposit: MINIMUM_DEPOSIT
                    },
                    treasury
                )
            ).to.be.revertedWith(
                'Initializable: contract is already initialized'
            )
        })

        it('tokens cannot be zero', async () => {
            bond = await deployContract('ERC20SingleCollateralBondBox')

            await expect(
                bond.initialize(
                    {
                        name: 'MDT002',
                        data: DATA,
                        symbol: 'My Debt Tokens two'
                    },
                    {
                        debtTokenAmount: ZERO,
                        collateralTokens: collateralTokens.address,
                        expiryTimestamp: BOND_EXPIRY,
                        minimumDeposit: MINIMUM_DEPOSIT
                    },
                    treasury
                )
            ).to.be.revertedWith('Bond::mint: too small')
        })

        it('treasury address cannot be zero', async () => {
            bond = await deployContract('ERC20SingleCollateralBondBox')

            await expect(
                bond.initialize(
                    {name: 'My Debt Tokens two', symbol: 'MDT002', data: DATA},
                    {
                        debtTokenAmount: ONE,
                        collateralTokens: collateralTokens.address,
                        expiryTimestamp: BOND_EXPIRY,
                        minimumDeposit: MINIMUM_DEPOSIT
                    },
                    ADDRESS_ZERO
                )
            ).to.be.revertedWith('Bond: treasury is zero address')
        })

        it('collateral tokens address cannot be zero', async () => {
            bond = await deployContract('ERC20SingleCollateralBondBox')

            await expect(
                bond.initialize(
                    {name: 'My Debt Tokens two', symbol: 'MDT003', data: DATA},
                    {
                        debtTokenAmount: ONE,
                        collateralTokens: ADDRESS_ZERO,
                        expiryTimestamp: BOND_EXPIRY,
                        minimumDeposit: MINIMUM_DEPOSIT
                    },
                    treasury
                )
            ).to.be.revertedWith('Bond: collateral is zero address')
        })

        it('initial debt tokens are recorded', async () => {
            const debtTokens = 554n
            bond = await deployContract('ERC20SingleCollateralBondBox')
            expect(await bond.initialDebtTokens()).equals(ZERO)

            await bond.initialize(
                {name: 'My Debt Tokens two', symbol: 'MDT004', data: ''},
                {
                    debtTokenAmount: debtTokens,
                    collateralTokens: collateralTokens.address,
                    expiryTimestamp: BOND_EXPIRY,
                    minimumDeposit: MINIMUM_DEPOSIT
                },
                treasury
            )

            expect(await bond.initialDebtTokens()).equals(debtTokens)
        })

        it('metadata', async () => {
            const debtTokens = 554n
            bond = await deployContract('ERC20SingleCollateralBondBox')
            expect(await bond.metaData()).equals('')

            const receipt = await successfulTransaction(
                bond.initialize(
                    {name: 'My Debt Tokens two', symbol: 'MDT006', data: DATA},
                    {
                        debtTokenAmount: debtTokens,
                        collateralTokens: collateralTokens.address,
                        expiryTimestamp: BOND_EXPIRY,
                        minimumDeposit: MINIMUM_DEPOSIT
                    },
                    treasury
                )
            )

            expect(await bond.metaData()).equals(DATA)
            const setMetaDataEvent: ExpectedMetaDataUpdateEvent[] = [
                {data: DATA, instigator: admin.address}
            ]
            verifyMetaDataUpdateEvents(receipt, setMetaDataEvent)
            verifyMetaDataUpdateLogEvents(bond, receipt, setMetaDataEvent)
        })

        it('token beneficiary', async () => {
            const debtTokens = 554n
            bond = await deployContract('ERC20SingleCollateralBondBox')
            expect(await bond.tokenSweepBeneficiary()).equals(ADDRESS_ZERO)

            const receipt = await successfulTransaction(
                bond.initialize(
                    {name: 'My Debt Tokens two', symbol: 'MDT006', data: DATA},
                    {
                        debtTokenAmount: debtTokens,
                        collateralTokens: collateralTokens.address,
                        expiryTimestamp: BOND_EXPIRY,
                        minimumDeposit: MINIMUM_DEPOSIT
                    },
                    treasury
                )
            )

            expect(await bond.tokenSweepBeneficiary()).equals(treasury)
            const expectedEvents = [
                {beneficiary: treasury, instigator: admin.address}
            ]
            verifyBeneficiaryUpdateEvents(receipt, expectedEvents)
            verifyBeneficiaryUpdateLogEvents(bond, receipt, expectedEvents)
        })
    })

    describe('MetaData', () => {
        it('updatable', async () => {
            const debtTokens = 554n
            const startMetaData = 'something you will neve know'
            const endMetadata = 'has changed to something else'
            bond = await deployContract('ERC20SingleCollateralBondBox')

            await bond.initialize(
                {
                    name: 'My Debt Tokens two',
                    symbol: 'MDT007',
                    data: startMetaData
                },
                {
                    debtTokenAmount: debtTokens,
                    collateralTokens: collateralTokens.address,
                    expiryTimestamp: BOND_EXPIRY,
                    minimumDeposit: MINIMUM_DEPOSIT
                },
                treasury
            )

            expect(await bond.metaData()).equals(startMetaData)

            const receipt = await successfulTransaction(
                bond.setMetaData(endMetadata)
            )

            expect(await bond.metaData()).equals(endMetadata)
            const setMetaDataEvent: ExpectedMetaDataUpdateEvent[] = [
                {data: endMetadata, instigator: admin.address}
            ]
            verifyMetaDataUpdateEvents(receipt, setMetaDataEvent)
            verifyMetaDataUpdateLogEvents(bond, receipt, setMetaDataEvent)
        })
    })

    describe('pause', () => {
        it('changes state', async () => {
            bond = await createBond(ONE)
            expect(await bond.paused()).is.false

            await bond.pause()

            expect(await bond.paused()).is.true
        })

        it('only when not paused', async () => {
            bond = await createBond(ONE)
            await bond.pause()

            await expect(bond.pause()).to.be.revertedWith('Pausable: paused')
        })

        it('only owner', async () => {
            bond = await createBond(ONE)

            await expect(bond.connect(guarantorTwo).pause()).to.be.revertedWith(
                'Ownable: caller is not the owner'
            )
        })
    })

    describe('redeem', () => {
        it('cannot be zero', async () => {
            const pledge = 500n
            bond = await createBond(23336777n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            const receipt = await allowRedemption(REDEMPTION_REASON)

            await expect(redeem(guarantorOne, ZERO)).to.be.revertedWith(
                'Bond: too small'
            )
            const redeemableEvents: ExpectedRedeemableUpdateEvent[] = [
                {
                    isRedeemable: true,
                    reason: REDEMPTION_REASON,
                    instigator: admin.address
                }
            ]
            verifyRedeemableEvents(receipt, redeemableEvents)
            verifyRedeemableUpdateLogEvents(bond, receipt, redeemableEvents)
        })

        it('only when redeemable', async () => {
            const pledge = 500n
            bond = await createBond(238877n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(
                bond.connect(guarantorOne).redeem(pledge)
            ).to.be.revertedWith('whenRedeemable: not redeemable')
        })

        it('only when not paused', async () => {
            const pledge = 500n
            bond = await createBond(238877n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await bond.pause()

            await expect(
                bond.connect(guarantorOne).redeem(pledge)
            ).to.be.revertedWith('Pausable: paused')
        })
    })

    describe('slash', () => {
        it('can be performed three times', async () => {
            const pledge = 500n
            const debtTokens = pledge
            const oneThirdOfSlash = 100n
            const slashAmount = 3n * oneThirdOfSlash
            const remainingCollateral = pledge - slashAmount
            bond = await createBond(debtTokens)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await bond.slash(oneThirdOfSlash, BOND_SLASH_REASON)
            await bond.slash(oneThirdOfSlash, BOND_SLASH_REASON)
            await bond.slash(oneThirdOfSlash, BOND_SLASH_REASON)

            await verifyBalances([
                {
                    address: bond.address,
                    bond: ZERO,
                    collateral: remainingCollateral
                },
                {address: guarantorOne, bond: debtTokens, collateral: ZERO},
                {address: treasury, bond: ZERO, collateral: slashAmount}
            ])
        })

        it('cannot be zero', async () => {
            const pledge = 500n
            bond = await createBond(2356666n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(
                bond.slash(ZERO, BOND_SLASH_REASON)
            ).to.be.revertedWith('Bond: too small')
        })

        it('cannot be greater than collateral held', async () => {
            const pledge = 500n
            bond = await createBond(23563377n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(
                bond.slash(pledge + 1n, BOND_SLASH_REASON)
            ).to.be.revertedWith('Bond: too large')
        })

        it('ony when not redeemable', async () => {
            const pledge = 500n
            bond = await createBond(2356677n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await allowRedemption(REDEMPTION_REASON)

            await expect(
                bond.slash(pledge, BOND_SLASH_REASON)
            ).to.be.revertedWith('whenNotRedeemable: redeemable')
        })

        it('ony when not paused', async () => {
            const pledge = 500n
            bond = await createBond(2356677n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await bond.pause()

            await expect(
                bond.slash(pledge, BOND_SLASH_REASON)
            ).to.be.revertedWith('Pausable: paused')
        })

        it('ony owner', async () => {
            const pledge = 500n
            bond = await createBond(2356677n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(
                bond.connect(guarantorOne).slash(pledge, BOND_SLASH_REASON)
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe('ERC20 token sweep', () => {
        it('side effects', async () => {
            const seedFunds = 100n
            const sweepAmount = 55n
            await successfulTransaction(
                collateralTokens.transfer(bond.address, seedFunds)
            )
            expect(await collateralTokens.balanceOf(bond.address)).equals(
                seedFunds
            )
            expect(await collateralTokens.balanceOf(treasury)).equals(0)

            const receipt = await successfulTransaction(
                bond.sweepERC20Tokens(collateralTokens.address, sweepAmount)
            )

            expect(await collateralTokens.balanceOf(bond.address)).equals(
                seedFunds - sweepAmount
            )
            expect(await collateralTokens.balanceOf(treasury)).equals(
                sweepAmount
            )
            const expectedEvents: ExpectedERC20SweepEvent[] = [
                {
                    beneficiary: treasury,
                    tokens: collateralTokens.address,
                    amount: sweepAmount,
                    instigator: admin.address
                }
            ]
            verifyERC20SweepEvents(receipt, expectedEvents)
            verifyERC20SweepLogEvents(bond, receipt, expectedEvents)
        })

        it('only owner', async () => {
            await expect(
                bond
                    .connect(guarantorThree)
                    .sweepERC20Tokens(collateralTokens.address, 5)
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('only when not paused', async () => {
            bond = await createBond(ONE)
            await bond.pause()

            await expect(
                bond.sweepERC20Tokens(collateralTokens.address, 5)
            ).to.be.revertedWith('Pausable: paused')
        })
    })

    describe('treasury', () => {
        it('update address', async () => {
            bond = await createBond(555666777n)
            expect(await bond.treasury()).equals(treasury)
            expect(await bond.tokenSweepBeneficiary()).equals(treasury)

            await bond.setTreasury(admin.address)

            expect(await bond.treasury()).equals(admin.address)
            expect(await bond.tokenSweepBeneficiary()).equals(admin.address)
        })
    })

    describe('unpause', () => {
        it('changes state', async () => {
            bond = await createBond(ONE)
            await bond.pause()
            expect(await bond.paused()).is.true

            await bond.unpause()

            expect(await bond.paused()).is.false
        })

        it('only when paused', async () => {
            bond = await createBond(ONE)

            await expect(bond.unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })

        it('only owner', async () => {
            bond = await createBond(ONE)

            await expect(bond.connect(guarantorTwo).pause()).to.be.revertedWith(
                'Ownable: caller is not the owner'
            )
        })
    })

    describe('withdraw collateral', () => {
        it('needs collateral remaining', async () => {
            bond = await createBond(MINIMUM_DEPOSIT)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: MINIMUM_DEPOSIT}
            ])
            await depositBond(guarantorOne, MINIMUM_DEPOSIT)
            await allowRedemption(REDEMPTION_REASON)
            await redeem(guarantorOne, MINIMUM_DEPOSIT)

            await expect(bond.withdrawCollateral()).to.be.revertedWith(
                'Bond: no collateral remains'
            )
        })

        it('only when not paused', async () => {
            bond = await createBond(ONE)
            await allowRedemption(REDEMPTION_REASON)
            await bond.pause()

            await expect(bond.withdrawCollateral()).to.be.revertedWith(
                'Pausable: paused'
            )
        })

        it('only when redeemable', async () => {
            bond = await createBond(ONE)

            await expect(bond.withdrawCollateral()).to.be.revertedWith(
                'whenRedeemable: not redeemable'
            )
        })

        it('only owner', async () => {
            bond = await createBond(ONE)
            await allowRedemption(REDEMPTION_REASON)

            await expect(
                bond.connect(guarantorOne).withdrawCollateral()
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    it('one guarantor deposit full collateral, then are fully slashed', async () => {
        const pledge = 40050n
        const debtTokensSupply = pledge
        const collateralAmount = debtTokensSupply
        const slashedCollateral = debtTokensSupply
        bond = await createBond(debtTokensSupply)
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledge}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokensSupply, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledge},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledge)
        const expectedDepositEvent = [
            {
                tokens: collateralTokens.address,
                amount: pledge,
                depositor: guarantorOne.address
            }
        ]
        verifyDepositEvents(depositOne, expectedDepositEvent)
        verifyDepositEventLogs(bond, depositOne, expectedDepositEvent)

        const expectedDebtIssueEvent = [
            {
                tokens: bond.address,
                amount: pledge,
                receiver: guarantorOne.address
            }
        ]
        verifyDebtIssueEvents(depositOne, expectedDebtIssueEvent)
        verifyDebtIssueEventLogs(bond, depositOne, expectedDebtIssueEvent)

        const expectedFullCollateralEvent = [
            {
                collateralTokens: collateralTokens.address,
                collateralAmount: collateralAmount,
                instigator: guarantorOne.address
            }
        ]
        verifyFullCollateralEvents(depositOne, expectedFullCollateralEvent)
        verifyFullCollateralEventLogs(
            bond,
            depositOne,
            expectedFullCollateralEvent
        )

        verifyERC20TransferEvents(depositOne, [
            {
                from: guarantorOne.address,
                to: bond.address,
                amount: pledge
            },
            {
                from: bond.address,
                to: guarantorOne.address,
                amount: pledge
            }
        ])

        // Bond holds all collateral, issued debt tokens
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: pledge},
            {address: guarantorOne, bond: debtTokensSupply, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Slash all the collateral assets
        const slashReceipt = await slashCollateral(
            slashedCollateral,
            BOND_SLASH_REASON
        )
        verifySlashDepositsEvent(slashReceipt, {
            tokens: collateralTokens.address,
            amount: slashedCollateral,
            reason: BOND_SLASH_REASON,
            instigator: admin.address
        })
        verifyERC20TransferEvents(slashReceipt, [
            {
                from: bond.address,
                to: treasury,
                amount: slashedCollateral
            }
        ])

        // Debt holdings should remain the same, collateral moved
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: ZERO},
            {address: guarantorOne, bond: pledge, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: slashedCollateral}
        ])

        // Bond redemption allowed by Owner
        const allowRedemptionReceipt = await allowRedemption(REDEMPTION_REASON)
        const expectedAllowRedemptionEvent = [
            {authorizer: admin.address, reason: REDEMPTION_REASON}
        ]
        verifyAllowRedemptionEvents(
            allowRedemptionReceipt,
            expectedAllowRedemptionEvent
        )
        verifyAllowRedemptionLogEvents(
            bond,
            allowRedemptionReceipt,
            expectedAllowRedemptionEvent
        )

        // Guarantor One redeem their bond, partial conversion (slashed)
        const redeemOneReceipt = await redeem(guarantorOne, pledge)
        verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {tokens: bond.address, amount: pledge, instigator: admin.address},
            {
                tokens: collateralTokens.address,
                amount: ZERO,
                instigator: admin.address
            }
        )
        verifyERC20TransferEvents(redeemOneReceipt, [
            {
                from: guarantorOne.address,
                to: ADDRESS_ZERO,
                amount: pledge
            }
        ])

        // Slashed collateral in Treasury, Guarantors redeemed, no debt remain
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: slashedCollateral}
        ])
    })

    it('one guarantor deposit partial collateral, partially slashed, then redeem', async () => {
        const pledge = 40050n
        const unmatchedDebtTokens = 750n
        const debtTokenAmount = pledge + unmatchedDebtTokens
        const slashedCollateral = slash(pledge, FORTY_PERCENT)
        bond = await createBond(debtTokenAmount)
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledge}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokenAmount, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledge},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledge)
        const expectedDebtIssueEvent = [
            {
                tokens: bond.address,
                amount: pledge,
                receiver: guarantorOne.address
            }
        ]
        verifyDebtIssueEvents(depositOne, expectedDebtIssueEvent)
        verifyDebtIssueEventLogs(bond, depositOne, expectedDebtIssueEvent)

        verifyERC20TransferEvents(depositOne, [
            {
                from: guarantorOne.address,
                to: bond.address,
                amount: pledge
            },
            {
                from: bond.address,
                to: guarantorOne.address,
                amount: pledge
            }
        ])

        // Bond holds all collateral, with unmatched debt tokens
        await verifyBalances([
            {
                address: bond.address,
                bond: unmatchedDebtTokens,
                collateral: pledge
            },
            {address: guarantorOne, bond: pledge, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Slash forty percent of the collateral assets
        const slashReceipt = await slashCollateral(
            slashedCollateral,
            BOND_SLASH_REASON
        )
        verifySlashDepositsEvent(slashReceipt, {
            tokens: collateralTokens.address,
            amount: slashedCollateral,
            reason: BOND_SLASH_REASON,
            instigator: admin.address
        })
        verifyERC20TransferEvents(slashReceipt, [
            {
                from: bond.address,
                to: treasury,
                amount: slashedCollateral
            }
        ])

        // Debt holdings should remain the same, collateral partially moved
        await verifyBalances([
            {
                address: bond.address,
                bond: unmatchedDebtTokens,
                collateral: pledge - slashedCollateral
            },
            {address: guarantorOne, bond: pledge, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: slashedCollateral}
        ])

        // Bond redemption allowed by Owner
        const allowRedemptionReceipt = await allowRedemption(REDEMPTION_REASON)
        const expectedAllowRedemptionEvent = [
            {authorizer: admin.address, reason: REDEMPTION_REASON}
        ]
        verifyAllowRedemptionEvents(
            allowRedemptionReceipt,
            expectedAllowRedemptionEvent
        )
        verifyAllowRedemptionLogEvents(
            bond,
            allowRedemptionReceipt,
            expectedAllowRedemptionEvent
        )

        verifyPartialCollateralEvent(
            allowRedemptionReceipt,
            {
                tokens: collateralTokens.address,
                amount: pledge - slashedCollateral,
                instigator: admin.address
            },
            {
                tokens: bond.address,
                amount: unmatchedDebtTokens,
                instigator: admin.address
            }
        )

        // Guarantor One redeem their bond, partial conversion (slashed)
        const redeemOneReceipt = await redeem(guarantorOne, pledge)
        verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {tokens: bond.address, amount: pledge, instigator: admin.address},
            {
                tokens: collateralTokens.address,
                amount: pledge - slashedCollateral,
                instigator: admin.address
            }
        )
        verifyERC20TransferEvents(redeemOneReceipt, [
            {
                from: guarantorOne.address,
                to: ADDRESS_ZERO,
                amount: pledge
            },
            {
                from: bond.address,
                to: guarantorOne.address,
                amount: pledge - slashedCollateral
            }
        ])

        // Slashed collateral in Treasury, Guarantors redeemed, unmatched debt remain
        await verifyBalances([
            {
                address: bond.address,
                bond: unmatchedDebtTokens,
                collateral: ZERO
            },
            {
                address: guarantorOne,
                bond: ZERO,
                collateral: pledge - slashedCollateral
            },
            {address: treasury, bond: ZERO, collateral: slashedCollateral}
        ])
    })

    it('two guarantors deposit full collateral, then fully redeem', async () => {
        const pledgeOne = 240050n
        const pledgeTwo = 99500n
        const debtTokenAmount = pledgeOne + pledgeTwo
        const collateralAmount = debtTokenAmount
        bond = await createBond(debtTokenAmount)
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledgeOne},
            {signer: guarantorTwo, pledge: pledgeTwo}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokenAmount, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOne},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwo},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledgeOne)
        const expectedDebtIssueEventOne = [
            {
                tokens: bond.address,
                amount: pledgeOne,
                receiver: guarantorOne.address
            }
        ]
        verifyDebtIssueEvents(depositOne, expectedDebtIssueEventOne)
        verifyDebtIssueEventLogs(bond, depositOne, expectedDebtIssueEventOne)

        verifyERC20TransferEvents(depositOne, [
            {
                from: guarantorOne.address,
                to: bond.address,
                amount: pledgeOne
            },
            {
                from: bond.address,
                to: guarantorOne.address,
                amount: pledgeOne
            }
        ])

        // Guarantor Two deposits their full pledge amount
        const depositTwo = await depositBond(guarantorTwo, pledgeTwo)
        const expectedDebtIssueEventTwo = [
            {
                tokens: bond.address,
                amount: pledgeTwo,
                receiver: guarantorTwo.address
            }
        ]
        verifyDebtIssueEvents(depositTwo, expectedDebtIssueEventTwo)
        verifyDebtIssueEventLogs(bond, depositTwo, expectedDebtIssueEventTwo)

        const expectedFullCollateralEvent = [
            {
                collateralTokens: collateralTokens.address,
                collateralAmount: collateralAmount,
                instigator: guarantorTwo.address
            }
        ]
        verifyFullCollateralEvents(depositTwo, expectedFullCollateralEvent)
        verifyFullCollateralEventLogs(
            bond,
            depositTwo,
            expectedFullCollateralEvent
        )

        verifyERC20TransferEvents(depositTwo, [
            {
                from: guarantorTwo.address,
                to: bond.address,
                amount: pledgeTwo
            },
            {
                from: bond.address,
                to: guarantorTwo.address,
                amount: pledgeTwo
            }
        ])

        // Bond holds all collateral, issued debt tokens
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: debtTokenAmount},
            {address: guarantorOne, bond: pledgeOne, collateral: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Bond redemption allowed by Owner
        const allowRedemptionReceipt = await allowRedemption(REDEMPTION_REASON)
        const expectedAllowRedemptionEvent = [
            {authorizer: admin.address, reason: REDEMPTION_REASON}
        ]
        verifyAllowRedemptionEvents(
            allowRedemptionReceipt,
            expectedAllowRedemptionEvent
        )
        verifyAllowRedemptionLogEvents(
            bond,
            allowRedemptionReceipt,
            expectedAllowRedemptionEvent
        )

        // Guarantor One redeem their bond, full conversion
        const redeemOneReceipt = await redeem(guarantorOne, pledgeOne)
        verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {
                tokens: bond.address,
                amount: pledgeOne,
                instigator: admin.address
            },
            {
                tokens: collateralTokens.address,
                amount: pledgeOne,
                instigator: admin.address
            }
        )
        verifyERC20TransferEvents(redeemOneReceipt, [
            {
                from: guarantorOne.address,
                to: ADDRESS_ZERO,
                amount: pledgeOne
            },
            {
                from: bond.address,
                to: guarantorOne.address,
                amount: pledgeOne
            }
        ])

        // Guarantor Two redeem their bond, full conversion
        const redeemTwoReceipt = await redeem(guarantorTwo, pledgeTwo)
        verifyRedemptionEvent(
            redeemTwoReceipt,
            guarantorTwo.address,
            {
                tokens: bond.address,
                amount: pledgeTwo,
                instigator: admin.address
            },
            {
                tokens: collateralTokens.address,
                amount: pledgeTwo,
                instigator: admin.address
            }
        )
        verifyERC20TransferEvents(redeemTwoReceipt, [
            {
                from: guarantorTwo.address,
                to: ADDRESS_ZERO,
                amount: pledgeTwo
            },
            {
                from: bond.address,
                to: guarantorTwo.address,
                amount: pledgeTwo
            }
        ])

        // Guarantors redeemed their full pledge, no debt tokens remain
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOne},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwo},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])
    })

    it('one guarantor deposit full collateral, are partially slashed, then fully redeems, with collateral left over due to rounding', async () => {
        const pledge = 12345n
        const pledgeSlashed = slash(pledge, FIFTY_PERCENT)
        const debtTokenAmount = pledge
        const slashedCollateral =
            debtTokenAmount - slash(debtTokenAmount, FIFTY_PERCENT)
        bond = await createBond(debtTokenAmount)
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledge}
        ])
        await depositBond(guarantorOne, pledge)
        await slashCollateral(slashedCollateral, BOND_SLASH_REASON)
        await allowRedemption(REDEMPTION_REASON)
        await redeem(guarantorOne, pledge)
        const pledgeSlashedFloored = pledgeSlashed - ONE

        // Slashed collateral in Treasury, Guarantors redeemed, no debt remain
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: ONE},
            {
                address: guarantorOne,
                bond: ZERO,
                collateral: pledgeSlashedFloored
            },
            {address: treasury, bond: ZERO, collateral: slashedCollateral}
        ])

        // Move the rounding error from the Bond contract to the Treasury
        const withdrawReceipt = await withdrawCollateral()
        verifyWithdrawCollateralEvent(withdrawReceipt, {
            to: treasury,
            tokens: collateralTokens.address,
            amount: ONE,
            instigator: admin.address
        })
        verifyERC20TransferEvents(withdrawReceipt, [
            {
                from: bond.address,
                to: treasury,
                amount: ONE
            }
        ])

        // Nothing in bond, with the rounding error now in the Treasury
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: ZERO},
            {
                address: guarantorOne,
                bond: ZERO,
                collateral: pledgeSlashedFloored
            },
            {address: treasury, bond: ZERO, collateral: slashedCollateral + ONE}
        ])
    })

    it('two guarantors deposit partial collateral, then fully redeem', async () => {
        const pledgeOne = 30050n
        const pledgeTwo = 59500n
        const unmatchedPledge = 500n
        const debtTokenAmount = pledgeOne + pledgeTwo + unmatchedPledge
        bond = await createBond(debtTokenAmount)
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledgeOne},
            {signer: guarantorTwo, pledge: pledgeTwo}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokenAmount, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOne},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwo},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledgeOne)
        const expectedDebtIssueEventOne = [
            {
                tokens: bond.address,
                amount: pledgeOne,
                receiver: guarantorOne.address
            }
        ]
        verifyDebtIssueEvents(depositOne, expectedDebtIssueEventOne)
        verifyDebtIssueEventLogs(bond, depositOne, expectedDebtIssueEventOne)

        verifyERC20TransferEvents(depositOne, [
            {
                from: guarantorOne.address,
                to: bond.address,
                amount: pledgeOne
            },
            {
                from: bond.address,
                to: guarantorOne.address,
                amount: pledgeOne
            }
        ])

        // Guarantor Two deposits their full pledge amount
        const depositTwo = await depositBond(guarantorTwo, pledgeTwo)
        const expectedDebtIssueEventTwo = [
            {
                tokens: bond.address,
                amount: pledgeTwo,
                receiver: guarantorTwo.address
            }
        ]
        verifyDebtIssueEvents(depositTwo, expectedDebtIssueEventTwo)
        verifyDebtIssueEventLogs(bond, depositTwo, expectedDebtIssueEventTwo)

        verifyERC20TransferEvents(depositTwo, [
            {
                from: guarantorTwo.address,
                to: bond.address,
                amount: pledgeTwo
            },
            {
                from: bond.address,
                to: guarantorTwo.address,
                amount: pledgeTwo
            }
        ])

        // Bond holds all collateral, with an unmatched pledge of debt tokens
        await verifyBalances([
            {
                address: bond.address,
                bond: unmatchedPledge,
                collateral: pledgeOne + pledgeTwo
            },
            {address: guarantorOne, bond: pledgeOne, collateral: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Bond redemption allowed by Owner
        const allowRedemptionReceipt = await allowRedemption(REDEMPTION_REASON)
        const expectedAllowRedemptionEvent = [
            {authorizer: admin.address, reason: REDEMPTION_REASON}
        ]
        verifyAllowRedemptionEvents(
            allowRedemptionReceipt,
            expectedAllowRedemptionEvent
        )
        verifyAllowRedemptionLogEvents(
            bond,
            allowRedemptionReceipt,
            expectedAllowRedemptionEvent
        )

        verifyPartialCollateralEvent(
            allowRedemptionReceipt,
            {
                tokens: collateralTokens.address,
                amount: pledgeOne + pledgeTwo,
                instigator: admin.address
            },
            {
                tokens: bond.address,
                amount: unmatchedPledge,
                instigator: admin.address
            }
        )

        // Guarantor One redeem their bond, full conversion
        const redeemOneReceipt = await redeem(guarantorOne, pledgeOne)
        verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {
                tokens: bond.address,
                amount: pledgeOne,
                instigator: admin.address
            },
            {
                tokens: collateralTokens.address,
                amount: pledgeOne,
                instigator: admin.address
            }
        )
        verifyERC20TransferEvents(redeemOneReceipt, [
            {
                from: guarantorOne.address,
                to: ADDRESS_ZERO,
                amount: pledgeOne
            },
            {
                from: bond.address,
                to: guarantorOne.address,
                amount: pledgeOne
            }
        ])

        // Guarantor Two redeem their bond, full conversion
        const redeemTwoReceipt = await redeem(guarantorTwo, pledgeTwo)
        verifyRedemptionEvent(
            redeemTwoReceipt,
            guarantorTwo.address,
            {
                tokens: bond.address,
                amount: pledgeTwo,
                instigator: admin.address
            },
            {
                tokens: collateralTokens.address,
                amount: pledgeTwo,
                instigator: admin.address
            }
        )
        verifyERC20TransferEvents(redeemTwoReceipt, [
            {
                from: guarantorTwo.address,
                to: ADDRESS_ZERO,
                amount: pledgeTwo
            },
            {
                from: bond.address,
                to: guarantorTwo.address,
                amount: pledgeTwo
            }
        ])

        // Guarantors redeemed their full pledge, unmatched debt tokens remain
        await verifyBalances([
            {address: bond.address, bond: unmatchedPledge, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOne},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwo},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])
    })

    it('two guarantors deposit full collateral, partially slashed, then expiry by owner', async () => {
        const pledgeOne = 30050n
        const pledgeTwo = 59500n
        const debtTokenAmount = pledgeOne + pledgeTwo
        const collateral = debtTokenAmount
        const slashedCollateral = slash(collateral, FORTY_PERCENT)
        bond = await createBond(debtTokenAmount)
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledgeOne},
            {signer: guarantorTwo, pledge: pledgeTwo}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokenAmount, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOne},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwo},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledgeOne)
        const expectedDebtIssueEvent = [
            {
                tokens: bond.address,
                amount: pledgeOne,
                receiver: guarantorOne.address
            }
        ]
        verifyDebtIssueEvents(depositOne, expectedDebtIssueEvent)
        verifyDebtIssueEventLogs(bond, depositOne, expectedDebtIssueEvent)

        verifyERC20TransferEvents(depositOne, [
            {
                from: guarantorOne.address,
                to: bond.address,
                amount: pledgeOne
            },
            {
                from: bond.address,
                to: guarantorOne.address,
                amount: pledgeOne
            }
        ])

        // Guarantor Two deposits their full pledge amount
        const depositTwo = await depositBond(guarantorTwo, pledgeTwo)
        const expectedDebtIssueEventTwo = [
            {
                tokens: bond.address,
                amount: pledgeTwo,
                receiver: guarantorTwo.address
            }
        ]
        verifyDebtIssueEvents(depositTwo, expectedDebtIssueEventTwo)
        verifyDebtIssueEventLogs(bond, depositTwo, expectedDebtIssueEventTwo)

        verifyERC20TransferEvents(depositTwo, [
            {
                from: guarantorTwo.address,
                to: bond.address,
                amount: pledgeTwo
            },
            {
                from: bond.address,
                to: guarantorTwo.address,
                amount: pledgeTwo
            }
        ])

        // Bond holds all collateral
        await verifyBalances([
            {
                address: bond.address,
                bond: ZERO,
                collateral: pledgeOne + pledgeTwo
            },
            {address: guarantorOne, bond: pledgeOne, collateral: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Slash forty percent of the collateral assets
        const slashReceipt = await slashCollateral(
            slashedCollateral,
            BOND_SLASH_REASON
        )
        verifySlashDepositsEvent(slashReceipt, {
            tokens: collateralTokens.address,
            amount: slashedCollateral,
            reason: BOND_SLASH_REASON,
            instigator: admin.address
        })
        verifyERC20TransferEvents(slashReceipt, [
            {
                from: bond.address,
                to: treasury,
                amount: slashedCollateral
            }
        ])

        // Owner expires the un-paused bond
        expect(await bond.paused()).is.false
        const expireReceipt = await expire()
        const expectedExpireEvent = [
            {
                treasury: treasury,
                tokens: collateralTokens.address,
                amount: collateral - slashedCollateral,
                instigator: admin.address
            }
        ]

        verifyExpireEvents(expireReceipt, expectedExpireEvent)
        verifyExpireEventLogs(bond, expireReceipt, expectedExpireEvent)

        verifyERC20TransferEvents(expireReceipt, [
            {
                from: bond.address,
                to: treasury,
                amount: collateral - slashedCollateral
            }
        ])

        // Treasury holds all collateral, with an unredeemed debt tokens still held
        await verifyBalances([
            {
                address: bond.address,
                bond: ZERO,
                collateral: ZERO
            },
            {address: guarantorOne, bond: pledgeOne, collateral: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: collateral}
        ])

        // The Bond must now be paused
        expect(await bond.paused()).is.true
    })

    it('three guarantors deposit full collateral, are partially slashed, then fully redeems', async () => {
        const pledgeOne = 40050n
        const pledgeOneSlashed = slash(pledgeOne, FORTY_PERCENT)
        const pledgeTwo = 229500n
        const pledgeTwoSlashed = slash(pledgeTwo, FORTY_PERCENT)
        const pledgeThree = 667780n
        const pledgeThreeSlashed = slash(pledgeThree, FORTY_PERCENT)
        const debtTokenAmount = pledgeOne + pledgeTwo + pledgeThree
        const slashedCollateral =
            debtTokenAmount - slash(debtTokenAmount, FORTY_PERCENT)
        const remainingCollateral = debtTokenAmount - slashedCollateral
        bond = await createBond(debtTokenAmount)
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledgeOne},
            {signer: guarantorTwo, pledge: pledgeTwo},
            {signer: guarantorThree, pledge: pledgeThree}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokenAmount, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOne},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwo},
            {address: guarantorThree, bond: ZERO, collateral: pledgeThree},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledgeOne)
        const expectedDepositEventOne = [
            {
                tokens: collateralTokens.address,
                amount: pledgeOne,
                depositor: guarantorOne.address
            }
        ]
        verifyDepositEvents(depositOne, expectedDepositEventOne)
        verifyDepositEventLogs(bond, depositOne, expectedDepositEventOne)
        const expectedDebtIssueEventOne = [
            {
                tokens: bond.address,
                amount: pledgeOne,
                receiver: guarantorOne.address
            }
        ]
        verifyDebtIssueEvents(depositOne, expectedDebtIssueEventOne)
        verifyDebtIssueEventLogs(bond, depositOne, expectedDebtIssueEventOne)

        verifyERC20TransferEvents(depositOne, [
            {
                from: guarantorOne.address,
                to: bond.address,
                amount: pledgeOne
            },
            {
                from: bond.address,
                to: guarantorOne.address,
                amount: pledgeOne
            }
        ])

        // Guarantor Two deposits their full pledge amount
        const depositTwo = await depositBond(guarantorTwo, pledgeTwo)
        const expectedDepositEventTwo = [
            {
                tokens: collateralTokens.address,
                amount: pledgeTwo,
                depositor: guarantorTwo.address
            }
        ]
        verifyDepositEvents(depositTwo, expectedDepositEventTwo)
        verifyDepositEventLogs(bond, depositTwo, expectedDepositEventTwo)

        const expectedDebtIssueEventTwo = [
            {
                tokens: bond.address,
                amount: pledgeTwo,
                receiver: guarantorTwo.address
            }
        ]
        verifyDebtIssueEvents(depositTwo, expectedDebtIssueEventTwo)
        verifyDebtIssueEventLogs(bond, depositTwo, expectedDebtIssueEventTwo)

        verifyERC20TransferEvents(depositTwo, [
            {
                from: guarantorTwo.address,
                to: bond.address,
                amount: pledgeTwo
            },
            {
                from: bond.address,
                to: guarantorTwo.address,
                amount: pledgeTwo
            }
        ])

        // Guarantor Three deposits their full pledge amount
        const depositThree = await depositBond(guarantorThree, pledgeThree)
        const expectedDepositEventThree = [
            {
                tokens: collateralTokens.address,
                amount: pledgeThree,
                depositor: guarantorThree.address
            }
        ]
        verifyDepositEvents(depositThree, expectedDepositEventThree)
        verifyDepositEventLogs(bond, depositThree, expectedDepositEventThree)

        const expectedDebtIssueEventThree = [
            {
                tokens: bond.address,
                amount: pledgeThree,
                receiver: guarantorThree.address
            }
        ]
        verifyDebtIssueEvents(depositThree, expectedDebtIssueEventThree)
        verifyDebtIssueEventLogs(
            bond,
            depositThree,
            expectedDebtIssueEventThree
        )

        verifyERC20TransferEvents(depositThree, [
            {
                from: guarantorThree.address,
                to: bond.address,
                amount: pledgeThree
            },
            {
                from: bond.address,
                to: guarantorThree.address,
                amount: pledgeThree
            }
        ])

        // Bond holds all collateral, issued debt tokens
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: debtTokenAmount},
            {address: guarantorOne, bond: pledgeOne, collateral: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, collateral: ZERO},
            {address: guarantorThree, bond: pledgeThree, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Slash forty percent from the collateral assets
        const slashReceipt = await slashCollateral(
            slashedCollateral,
            BOND_SLASH_REASON
        )
        verifySlashDepositsEvent(slashReceipt, {
            tokens: collateralTokens.address,
            amount: slashedCollateral,
            reason: BOND_SLASH_REASON,
            instigator: admin.address
        })
        verifyERC20TransferEvents(slashReceipt, [
            {
                from: bond.address,
                to: treasury,
                amount: slashedCollateral
            }
        ])

        // Debt holdings should remain the same, only collateral moved
        await verifyBalances([
            {
                address: bond.address,
                bond: ZERO,
                collateral: remainingCollateral
            },
            {address: guarantorOne, bond: pledgeOne, collateral: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, collateral: ZERO},
            {address: guarantorThree, bond: pledgeThree, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: slashedCollateral}
        ])

        // Bond redemption allowed by Owner
        const allowRedemptionReceipt = await allowRedemption(REDEMPTION_REASON)
        const expectedAllowRedemptionEvent = [
            {authorizer: admin.address, reason: REDEMPTION_REASON}
        ]
        verifyAllowRedemptionEvents(
            allowRedemptionReceipt,
            expectedAllowRedemptionEvent
        )
        verifyAllowRedemptionLogEvents(
            bond,
            allowRedemptionReceipt,
            expectedAllowRedemptionEvent
        )

        // Guarantor One redeem their bond, partial conversion (slashed)
        const redeemOneReceipt = await redeem(guarantorOne, pledgeOne)
        verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {
                tokens: bond.address,
                amount: pledgeOne,
                instigator: admin.address
            },
            {
                tokens: collateralTokens.address,
                amount: pledgeOneSlashed,
                instigator: admin.address
            }
        )
        verifyERC20TransferEvents(redeemOneReceipt, [
            {
                from: guarantorOne.address,
                to: ADDRESS_ZERO,
                amount: pledgeOne
            },
            {
                from: bond.address,
                to: guarantorOne.address,
                amount: pledgeOneSlashed
            }
        ])

        // Guarantor Two redeem their bond, partial conversion (slashed)
        const redeemTwoReceipt = await redeem(guarantorTwo, pledgeTwo)
        verifyRedemptionEvent(
            redeemTwoReceipt,
            guarantorTwo.address,
            {
                tokens: bond.address,
                amount: pledgeTwo,
                instigator: admin.address
            },
            {
                tokens: collateralTokens.address,
                amount: pledgeTwoSlashed,
                instigator: admin.address
            }
        )
        verifyERC20TransferEvents(redeemTwoReceipt, [
            {
                from: guarantorTwo.address,
                to: ADDRESS_ZERO,
                amount: pledgeTwo
            },
            {
                from: bond.address,
                to: guarantorTwo.address,
                amount: pledgeTwoSlashed
            }
        ])

        // Guarantor Three redeem their bond, partial conversion (slashed)
        const redeemThreeReceipt = await redeem(guarantorThree, pledgeThree)
        verifyRedemptionEvent(
            redeemThreeReceipt,
            guarantorThree.address,
            {
                tokens: bond.address,
                amount: pledgeThree,
                instigator: admin.address
            },
            {
                tokens: collateralTokens.address,
                amount: pledgeThreeSlashed,
                instigator: admin.address
            }
        )
        verifyERC20TransferEvents(redeemThreeReceipt, [
            {
                from: guarantorThree.address,
                to: ADDRESS_ZERO,
                amount: pledgeThree
            },
            {
                from: bond.address,
                to: guarantorThree.address,
                amount: pledgeThreeSlashed
            }
        ])

        // Slashed collateral in Treasury, Guarantors redeemed, no debt remain
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOneSlashed},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwoSlashed},
            {
                address: guarantorThree,
                bond: ZERO,
                collateral: pledgeThreeSlashed
            },
            {address: treasury, bond: ZERO, collateral: slashedCollateral}
        ])
    })

    async function expire(): Promise<ContractReceipt> {
        return successfulTransaction(bond.expire())
    }

    async function redeem(
        guarantor: SignerWithAddress,
        amount: bigint
    ): Promise<ContractReceipt> {
        return successfulTransaction(bond.connect(guarantor).redeem(amount))
    }

    async function slashCollateral(
        amount: bigint,
        reason: string
    ): Promise<ContractReceipt> {
        return successfulTransaction(bond.slash(amount, reason))
    }

    async function allowRedemption(reason: string): Promise<ContractReceipt> {
        return successfulTransaction(bond.allowRedemption(reason))
    }

    async function withdrawCollateral(): Promise<ContractReceipt> {
        return successfulTransaction(bond.withdrawCollateral())
    }

    async function depositBond(
        guarantor: SignerWithAddress,
        pledge: bigint
    ): Promise<ContractReceipt> {
        return successfulTransaction(bond.connect(guarantor).deposit(pledge))
    }

    async function verifyBalances(balances: ExpectedBalance[]): Promise<void> {
        for (let i = 0; i < balances.length; i++) {
            await verifyBondAndCollateralBalances(
                balances[i],
                collateralTokens,
                bond
            )
        }
    }

    async function setupGuarantorsWithCollateral(
        guarantors: GuarantorCollateralSetup[]
    ): Promise<void> {
        for (let i = 0; i < guarantors.length; i++) {
            await setupGuarantorWithCollateral(
                guarantors[i],
                bond,
                collateralTokens
            )
        }
    }

    async function createBond(
        debtTokenAmount: BigNumberish
    ): Promise<ERC20SingleCollateralBondBox> {
        bond = await deployContract('ERC20SingleCollateralBondBox')
        expect(ethers.utils.isAddress(bond.address)).is.true

        await bond.initialize(
            {
                name: 'My Debt Tokens two',
                symbol: 'MDT007',
                data: DATA
            },
            {
                debtTokenAmount: debtTokenAmount,
                collateralTokens: collateralTokens.address,
                expiryTimestamp: BOND_EXPIRY,
                minimumDeposit: MINIMUM_DEPOSIT
            },
            treasury
        )

        return bond
    }

    let admin: SignerWithAddress
    let bond: ERC20SingleCollateralBondBox
    let treasury: string
    let collateralTokens: ERC20
    let guarantorOne: SignerWithAddress
    let guarantorTwo: SignerWithAddress
    let guarantorThree: SignerWithAddress
})

function slash(amount: bigint, percent: bigint): bigint {
    return ((100n - percent) * amount) / 100n
}

type ExpectedBalance = {
    address: string | SignerWithAddress
    bond: bigint
    collateral: bigint
}

export type GuarantorCollateralSetup = {
    signer: SignerWithAddress
    pledge: bigint
}

async function setupGuarantorWithCollateral(
    guarantor: GuarantorCollateralSetup,
    bond: ERC20SingleCollateralBondBox,
    collateral: ERC20
) {
    await collateral.transfer(guarantor.signer.address, guarantor.pledge)
    await collateral
        .connect(guarantor.signer)
        .increaseAllowance(bond.address, guarantor.pledge)
}

async function verifyBondAndCollateralBalances(
    balance: ExpectedBalance,
    collateral: IERC20,
    bond: ERC20SingleCollateralBondBox
): Promise<void> {
    const address =
        typeof balance.address === 'string'
            ? balance.address
            : balance.address.address

    expect(await bond.balanceOf(address), 'Bond balance for ' + address).equals(
        balance.bond
    )
    expect(
        await collateral.balanceOf(address),
        'Collateral balance for ' + address
    ).equals(balance.collateral)
}
