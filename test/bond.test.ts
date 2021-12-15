// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BitDAO, Bond, BondFactory, ERC20} from '../typechain'
import {
    deployContract,
    deployContractWithProxy,
    execute,
    signer
} from './framework/contracts'
import {BigNumberish, ContractReceipt, constants, ethers} from 'ethers'
import {event} from './framework/events'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'
import {
    verifyAllowRedemptionEvent,
    verifyDebtIssueEvent,
    verifyExpireEvent,
    verifyFullCollateralEvent,
    verifyPartialCollateralEvent,
    verifyRedemptionEvent,
    verifySlashEvent,
    verifyTransferEvents,
    verifyWithdrawCollateralEvent
} from './contracts/bond/verify-bond-events'
import {createBondEvent} from './contracts/bond/bond-factory-events'
import {bondContractAt} from './contracts/bond/bond-contract'

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

describe('Bond contract', () => {
    before(async () => {
        admin = await signer(0)
        treasury = (await signer(1)).address
        guarantorOne = await signer(2)
        guarantorTwo = await signer(3)
        guarantorThree = await signer(4)
    })

    beforeEach(async () => {
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin.address)
        collateralSymbol = await collateralTokens.symbol()
        bonds = await deployContractWithProxy<BondFactory>(
            'BondFactory',
            collateralTokens.address,
            treasury
        )
    })

    describe('allow redemption', () => {
        it('changes state', async () => {
            bond = await createBond(bonds, ONE)
            expect(await bond.redeemable()).is.false

            await bond.allowRedemption()

            expect(await bond.redeemable()).is.true
        })

        it('only when not paused', async () => {
            bond = await createBond(bonds, ONE)
            await bond.pause()

            await expect(bond.allowRedemption()).to.be.revertedWith(
                'Pausable: paused'
            )
        })

        it('only when not redeemable', async () => {
            bond = await createBond(bonds, ONE)
            await bond.allowRedemption()

            await expect(bond.allowRedemption()).to.be.revertedWith(
                'whenNotRedeemable: redeemable'
            )
        })

        it('only owner', async () => {
            bond = await createBond(bonds, ONE)

            await expect(
                bond.connect(guarantorOne).allowRedemption()
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe('collateral', () => {
        it('increases on deposit', async () => {
            const pledgeOne = 998877n
            const pledgeTwo = 99n
            const totalPledge = pledgeOne + pledgeTwo
            bond = await createBond(bonds, totalPledge)
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
            bond = await createBond(bonds, pledge)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await bond.allowRedemption()
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
        it('increases', async () => {
            const slashOne = 9000n
            const slashTwo = 44300n
            const pledge = slashOne + slashTwo + 675n
            bond = await createBond(bonds, pledge)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            expect(await bond.collateralSlashed()).equals(ZERO)

            await slashCollateral(slashOne)

            expect(await bond.collateralSlashed()).equals(slashOne)

            await slashCollateral(slashTwo)

            expect(await bond.collateralSlashed()).equals(slashOne + slashTwo)
            expect(await bond.collateral()).equals(pledge - slashOne - slashTwo)
        })
    })

    describe('debt tokens', () => {
        it('initial supply', async () => {
            const initialSupply = 97500n
            bond = await createBond(bonds, initialSupply)

            expect(await bond.debtTokens()).equals(initialSupply)
        })

        it('decreases on deposit', async () => {
            const initialSupply = 97500n
            const pledgeOne = 500n
            const pledgeTwo = 7500n
            const pledgeTotal = pledgeOne + pledgeTwo
            bond = await createBond(bonds, initialSupply)
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
            bond = await createBond(bonds, initialSupply)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await bond.allowRedemption()
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
            bond = await createBond(bonds, initialSupply)
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
            bond = await createBond(bonds, initialSupply)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledgeTotal}
            ])
            await depositBond(guarantorOne, pledgeOne)
            await depositBond(guarantorOne, pledgeTwo)
            await allowRedemption()
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
            bond = await createBond(bonds, 5566777n)

            await expect(bond.deposit(ZERO)).to.be.revertedWith(
                'Bond: too small'
            )
        })

        it('cannot be greater than available Debt Tokens', async () => {
            const debtTokens = 500000n
            bond = await createBond(bonds, debtTokens)

            await expect(bond.deposit(debtTokens + 1n)).to.be.revertedWith(
                'Bond: too large'
            )
        })

        it('cannot be below minimum deposit', async () => {
            const belowMinimum = MINIMUM_DEPOSIT - 1n
            bond = await createBond(bonds, 5566777n)

            await expect(bond.deposit(belowMinimum)).to.be.revertedWith(
                'Bond: below minimum'
            )
        })

        it('only when not paused', async () => {
            const pledge = 60n
            bond = await createBond(bonds, pledge)
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
            bond = await createBond(bonds, 235666777n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await allowRedemption()

            await expect(
                bond.connect(guarantorOne).deposit(pledge)
            ).to.be.revertedWith('whenNotRedeemable: redeemable')
        })

        it('with full collateral', async () => {
            const pledge = 5040n
            bond = await createBond(bonds, pledge)
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
            bond = await createBond(bonds, pledge)
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
            bond = await createBond(bonds, pledge)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await bond.allowRedemption()
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
            bond = await createBond(bonds, pledge)
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
            bond = await createBond(bonds, 500n)

            await expect(
                bond.connect(guarantorOne).expire()
            ).to.be.revertedWith('Bond: no collateral remains')
        })

        it('only after expiry', async () => {
            const receipt = await execute(
                bonds.createBond(
                    'Special Debt Certificate',
                    'SDC001',
                    500n,
                    collateralSymbol,
                    Date.now() + ONE_DAY_MS,
                    MINIMUM_DEPOSIT,
                    DATA
                )
            )
            bond = await bondContractAt(
                createBondEvent(event('CreateBond', receipt)).bond
            )

            await expect(bond.expire()).to.be.revertedWith(
                'ExpiryTimestamp: not yet expired'
            )
        })
    })

    describe('init', () => {
        it('can only call once', async () => {
            bond = await createBond(bonds, ONE)

            await expect(
                bond.initialize(
                    'My Debt Tokens one',
                    'MDT001',
                    ONE,
                    collateralTokens.address,
                    treasury,
                    BOND_EXPIRY,
                    MINIMUM_DEPOSIT,
                    DATA
                )
            ).to.be.revertedWith(
                'Initializable: contract is already initialized'
            )
        })

        it('tokens cannot be zero', async () => {
            bond = await deployContract('Bond')

            await expect(
                bond.initialize(
                    'My Debt Tokens two',
                    'MDT002',
                    ZERO,
                    collateralTokens.address,
                    treasury,
                    BOND_EXPIRY,
                    MINIMUM_DEPOSIT,
                    DATA
                )
            ).to.be.revertedWith('Bond::mint: too small')
        })

        it('treasury address cannot be zero', async () => {
            bond = await deployContract('Bond')

            await expect(
                bond.initialize(
                    'My Debt Tokens two',
                    'MDT002',
                    ONE,
                    collateralTokens.address,
                    ADDRESS_ZERO,
                    BOND_EXPIRY,
                    MINIMUM_DEPOSIT,
                    DATA
                )
            ).to.be.revertedWith('Bond: treasury is zero address')
        })

        it('collateral tokens address cannot be zero', async () => {
            bond = await deployContract('Bond')

            await expect(
                bond.initialize(
                    'My Debt Tokens two',
                    'MDT002',
                    ONE,
                    ADDRESS_ZERO,
                    treasury,
                    BOND_EXPIRY,
                    MINIMUM_DEPOSIT,
                    DATA
                )
            ).to.be.revertedWith('Bond: collateral is zero address')
        })

        it('initial debt tokens are recorded', async () => {
            const debtTokens = 554n
            bond = await deployContract('Bond')
            expect(await bond.initialDebtTokens()).equals(ZERO)

            await bond.initialize(
                'My Debt Tokens two',
                'MDT002',
                debtTokens,
                collateralTokens.address,
                treasury,
                BOND_EXPIRY,
                MINIMUM_DEPOSIT,
                DATA
            )

            expect(await bond.initialDebtTokens()).equals(debtTokens)
        })

        it('metadata is initialised', async () => {
            const debtTokens = 554n
            bond = await deployContract('Bond')
            expect(await bond.metaData()).equals('')

            await bond.initialize(
                'My Debt Tokens two',
                'MDT002',
                debtTokens,
                collateralTokens.address,
                treasury,
                BOND_EXPIRY,
                MINIMUM_DEPOSIT,
                DATA
            )

            expect(await bond.metaData()).equals(DATA)
        })

        it('metadata is updatable', async () => {
            const debtTokens = 554n
            const startMetaData = 'something you will neve know'
            const endMetadata = 'has changed to something else'
            bond = await deployContract('Bond')
            await bond.initialize(
                'My Debt Tokens two',
                'MDT002',
                debtTokens,
                collateralTokens.address,
                treasury,
                BOND_EXPIRY,
                MINIMUM_DEPOSIT,
                startMetaData
            )
            expect(await bond.metaData()).equals(startMetaData)

            await successfulTransaction(bond.setMetaData(endMetadata))

            expect(await bond.metaData()).equals(endMetadata)
        })
    })

    describe('pause', () => {
        it('changes state', async () => {
            bond = await createBond(bonds, ONE)
            expect(await bond.paused()).is.false

            await bond.pause()

            expect(await bond.paused()).is.true
        })

        it('only when not paused', async () => {
            bond = await createBond(bonds, ONE)
            await bond.pause()

            await expect(bond.pause()).to.be.revertedWith('Pausable: paused')
        })

        it('only owner', async () => {
            bond = await createBond(bonds, ONE)

            await expect(bond.connect(guarantorTwo).pause()).to.be.revertedWith(
                'Ownable: caller is not the owner'
            )
        })
    })

    describe('redeem', () => {
        it('cannot be zero', async () => {
            const pledge = 500n
            bond = await createBond(bonds, 23336777n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await allowRedemption()

            await expect(redeem(guarantorOne, ZERO)).to.be.revertedWith(
                'Bond: too small'
            )
        })

        it('only when redeemable', async () => {
            const pledge = 500n
            bond = await createBond(bonds, 238877n)
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
            bond = await createBond(bonds, 238877n)
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
            bond = await createBond(bonds, debtTokens)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await bond.slash(oneThirdOfSlash)
            await bond.slash(oneThirdOfSlash)
            await bond.slash(oneThirdOfSlash)

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
            bond = await createBond(bonds, 2356666n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(bond.slash(ZERO)).to.be.revertedWith('Bond: too small')
        })

        it('cannot be greater than collateral held', async () => {
            const pledge = 500n
            bond = await createBond(bonds, 23563377n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(bond.slash(pledge + 1n)).to.be.revertedWith(
                'Bond: too large'
            )
        })

        it('ony when not redeemable', async () => {
            const pledge = 500n
            bond = await createBond(bonds, 2356677n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await allowRedemption()

            await expect(bond.slash(pledge)).to.be.revertedWith(
                'whenNotRedeemable: redeemable'
            )
        })

        it('ony when not paused', async () => {
            const pledge = 500n
            bond = await createBond(bonds, 2356677n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await bond.pause()

            await expect(bond.slash(pledge)).to.be.revertedWith(
                'Pausable: paused'
            )
        })

        it('ony owner', async () => {
            const pledge = 500n
            bond = await createBond(bonds, 2356677n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(
                bond.connect(guarantorOne).slash(pledge)
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe('treasury', () => {
        it('update address', async () => {
            bond = await createBond(bonds, 555666777n)

            const treasuryBefore = await bond.treasury()
            expect(treasuryBefore).equals(treasury)

            await bond.setTreasury(admin.address)
            const treasuryAfter = await bond.treasury()
            expect(treasuryAfter).equals(admin.address)
        })
    })

    describe('unpause', () => {
        it('changes state', async () => {
            bond = await createBond(bonds, ONE)
            await bond.pause()
            expect(await bond.paused()).is.true

            await bond.unpause()

            expect(await bond.paused()).is.false
        })

        it('only when paused', async () => {
            bond = await createBond(bonds, ONE)

            await expect(bond.unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })

        it('only owner', async () => {
            bond = await createBond(bonds, ONE)
            await bond.pause()

            await expect(
                bond.connect(guarantorTwo).unpause()
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe('withdraw collateral', () => {
        it('needs collateral remaining', async () => {
            bond = await createBond(bonds, MINIMUM_DEPOSIT)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: MINIMUM_DEPOSIT}
            ])
            await depositBond(guarantorOne, MINIMUM_DEPOSIT)
            await allowRedemption()
            await redeem(guarantorOne, MINIMUM_DEPOSIT)

            await expect(bond.withdrawCollateral()).to.be.revertedWith(
                'Bond: no collateral remains'
            )
        })

        it('only when not paused', async () => {
            bond = await createBond(bonds, ONE)
            await allowRedemption()
            await bond.pause()

            await expect(bond.withdrawCollateral()).to.be.revertedWith(
                'Pausable: paused'
            )
        })

        it('only when redeemable', async () => {
            bond = await createBond(bonds, ONE)

            await expect(bond.withdrawCollateral()).to.be.revertedWith(
                'whenRedeemable: not redeemable'
            )
        })

        it('only owner', async () => {
            bond = await createBond(bonds, ONE)
            await allowRedemption()

            await expect(
                bond.connect(guarantorOne).withdrawCollateral()
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    it('one guarantor deposit full collateral, then are fully slashed', async () => {
        const pledge = 40050n
        const debtTokens = pledge
        const collateralAmount = debtTokens
        const slashedCollateral = debtTokens
        bond = await createBond(bonds, debtTokens)
        const debtSymbol = await bond.symbol()
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledge}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokens, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledge},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledge)
        verifyDebtIssueEvent(depositOne, guarantorOne.address, {
            symbol: debtSymbol,
            amount: pledge
        })
        verifyFullCollateralEvent(depositOne, {
            symbol: collateralSymbol,
            amount: collateralAmount
        })
        verifyTransferEvents(depositOne, [
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
            {address: guarantorOne, bond: debtTokens, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Slash all of the collateral assets
        const slashReceipt = await slashCollateral(slashedCollateral)
        verifySlashEvent(slashReceipt, {
            symbol: collateralSymbol,
            amount: slashedCollateral
        })
        verifyTransferEvents(slashReceipt, [
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
        const allowRedemptionReceipt = await allowRedemption()
        verifyAllowRedemptionEvent(allowRedemptionReceipt, admin.address)

        // Guarantor One redeem their bond, partial conversion (slashed)
        const redeemOneReceipt = await redeem(guarantorOne, pledge)
        verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledge},
            {symbol: collateralSymbol, amount: ZERO}
        )
        verifyTransferEvents(redeemOneReceipt, [
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
        const debtTokens = pledge + unmatchedDebtTokens
        const slashedCollateral = slash(pledge, FORTY_PERCENT)
        bond = await createBond(bonds, debtTokens)
        const debtSymbol = await bond.symbol()
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledge}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokens, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledge},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledge)
        verifyDebtIssueEvent(depositOne, guarantorOne.address, {
            symbol: debtSymbol,
            amount: pledge
        })
        verifyTransferEvents(depositOne, [
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
        const slashReceipt = await slashCollateral(slashedCollateral)
        verifySlashEvent(slashReceipt, {
            symbol: collateralSymbol,
            amount: slashedCollateral
        })
        verifyTransferEvents(slashReceipt, [
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
        const allowRedemptionReceipt = await allowRedemption()
        verifyAllowRedemptionEvent(allowRedemptionReceipt, admin.address)
        verifyPartialCollateralEvent(
            allowRedemptionReceipt,
            {
                symbol: collateralSymbol,
                amount: pledge - slashedCollateral
            },
            {
                symbol: debtSymbol,
                amount: unmatchedDebtTokens
            }
        )

        // Guarantor One redeem their bond, partial conversion (slashed)
        const redeemOneReceipt = await redeem(guarantorOne, pledge)
        verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledge},
            {symbol: collateralSymbol, amount: pledge - slashedCollateral}
        )
        verifyTransferEvents(redeemOneReceipt, [
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
        const debtTokens = pledgeOne + pledgeTwo
        const collateralAmount = debtTokens
        bond = await createBond(bonds, debtTokens)
        const debtSymbol = await bond.symbol()
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledgeOne},
            {signer: guarantorTwo, pledge: pledgeTwo}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokens, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOne},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwo},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledgeOne)
        verifyDebtIssueEvent(depositOne, guarantorOne.address, {
            symbol: debtSymbol,
            amount: pledgeOne
        })
        verifyTransferEvents(depositOne, [
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
        verifyDebtIssueEvent(depositTwo, guarantorTwo.address, {
            symbol: debtSymbol,
            amount: pledgeTwo
        })
        verifyFullCollateralEvent(depositTwo, {
            symbol: collateralSymbol,
            amount: collateralAmount
        })
        verifyTransferEvents(depositTwo, [
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
            {address: bond.address, bond: ZERO, collateral: debtTokens},
            {address: guarantorOne, bond: pledgeOne, collateral: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Bond redemption allowed by Owner
        const allowRedemptionReceipt = await allowRedemption()
        verifyAllowRedemptionEvent(allowRedemptionReceipt, admin.address)

        // Guarantor One redeem their bond, full conversion
        const redeemOneReceipt = await redeem(guarantorOne, pledgeOne)
        verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledgeOne},
            {symbol: collateralSymbol, amount: pledgeOne}
        )
        verifyTransferEvents(redeemOneReceipt, [
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
            {symbol: debtSymbol, amount: pledgeTwo},
            {symbol: collateralSymbol, amount: pledgeTwo}
        )
        verifyTransferEvents(redeemTwoReceipt, [
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
        const debtTokens = pledge
        const slashedCollateral = debtTokens - slash(debtTokens, FIFTY_PERCENT)
        bond = await createBond(bonds, debtTokens)
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledge}
        ])
        await depositBond(guarantorOne, pledge)
        await slashCollateral(slashedCollateral)
        await allowRedemption()
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
            symbol: collateralSymbol,
            amount: ONE
        })
        verifyTransferEvents(withdrawReceipt, [
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
        const debtTokens = pledgeOne + pledgeTwo + unmatchedPledge
        bond = await createBond(bonds, debtTokens)
        const debtSymbol = await bond.symbol()
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledgeOne},
            {signer: guarantorTwo, pledge: pledgeTwo}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokens, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOne},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwo},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledgeOne)
        verifyDebtIssueEvent(depositOne, guarantorOne.address, {
            symbol: debtSymbol,
            amount: pledgeOne
        })
        verifyTransferEvents(depositOne, [
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
        verifyDebtIssueEvent(depositTwo, guarantorTwo.address, {
            symbol: debtSymbol,
            amount: pledgeTwo
        })
        verifyTransferEvents(depositTwo, [
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
        const allowRedemptionReceipt = await allowRedemption()
        verifyAllowRedemptionEvent(allowRedemptionReceipt, admin.address)
        verifyPartialCollateralEvent(
            allowRedemptionReceipt,
            {symbol: collateralSymbol, amount: pledgeOne + pledgeTwo},
            {symbol: debtSymbol, amount: unmatchedPledge}
        )

        // Guarantor One redeem their bond, full conversion
        const redeemOneReceipt = await redeem(guarantorOne, pledgeOne)
        verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledgeOne},
            {symbol: collateralSymbol, amount: pledgeOne}
        )
        verifyTransferEvents(redeemOneReceipt, [
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
            {symbol: debtSymbol, amount: pledgeTwo},
            {symbol: collateralSymbol, amount: pledgeTwo}
        )
        verifyTransferEvents(redeemTwoReceipt, [
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
        const debtTokens = pledgeOne + pledgeTwo
        const collateral = debtTokens
        const slashedCollateral = slash(collateral, FORTY_PERCENT)
        bond = await createBond(bonds, debtTokens)
        const debtSymbol = await bond.symbol()
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledgeOne},
            {signer: guarantorTwo, pledge: pledgeTwo}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokens, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOne},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwo},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledgeOne)
        verifyDebtIssueEvent(depositOne, guarantorOne.address, {
            symbol: debtSymbol,
            amount: pledgeOne
        })
        verifyTransferEvents(depositOne, [
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
        verifyDebtIssueEvent(depositTwo, guarantorTwo.address, {
            symbol: debtSymbol,
            amount: pledgeTwo
        })
        verifyTransferEvents(depositTwo, [
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
        const slashReceipt = await slashCollateral(slashedCollateral)
        verifySlashEvent(slashReceipt, {
            symbol: collateralSymbol,
            amount: slashedCollateral
        })
        verifyTransferEvents(slashReceipt, [
            {
                from: bond.address,
                to: treasury,
                amount: slashedCollateral
            }
        ])

        // Owner expires the un-paused bond
        expect(await bond.paused()).is.false
        const expireReceipt = await expire()
        verifyExpireEvent(expireReceipt, admin.address, treasury, {
            symbol: collateralSymbol,
            amount: collateral - slashedCollateral
        })
        verifyTransferEvents(expireReceipt, [
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
        const debtTokens = pledgeOne + pledgeTwo + pledgeThree
        const slashedCollateral = debtTokens - slash(debtTokens, FORTY_PERCENT)
        const remainingCollateral = debtTokens - slashedCollateral
        bond = await createBond(bonds, debtTokens)
        const debtSymbol = await bond.symbol()
        await setupGuarantorsWithCollateral([
            {signer: guarantorOne, pledge: pledgeOne},
            {signer: guarantorTwo, pledge: pledgeTwo},
            {signer: guarantorThree, pledge: pledgeThree}
        ])

        // Each Guarantor has their full collateral amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtTokens, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOne},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwo},
            {address: guarantorThree, bond: ZERO, collateral: pledgeThree},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledgeOne)
        verifyDebtIssueEvent(depositOne, guarantorOne.address, {
            symbol: debtSymbol,
            amount: pledgeOne
        })
        verifyTransferEvents(depositOne, [
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
        verifyDebtIssueEvent(depositTwo, guarantorTwo.address, {
            symbol: debtSymbol,
            amount: pledgeTwo
        })
        verifyTransferEvents(depositTwo, [
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
        verifyDebtIssueEvent(depositThree, guarantorThree.address, {
            symbol: debtSymbol,
            amount: pledgeThree
        })
        verifyTransferEvents(depositThree, [
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
            {address: bond.address, bond: ZERO, collateral: debtTokens},
            {address: guarantorOne, bond: pledgeOne, collateral: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, collateral: ZERO},
            {address: guarantorThree, bond: pledgeThree, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Slash forty percent from the collateral assets
        const slashReceipt = await slashCollateral(slashedCollateral)
        verifySlashEvent(slashReceipt, {
            symbol: collateralSymbol,
            amount: slashedCollateral
        })
        verifyTransferEvents(slashReceipt, [
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
        const allowRedemptionReceipt = await allowRedemption()
        verifyAllowRedemptionEvent(allowRedemptionReceipt, admin.address)

        // Guarantor One redeem their bond, partial conversion (slashed)
        const redeemOneReceipt = await redeem(guarantorOne, pledgeOne)
        verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledgeOne},
            {symbol: collateralSymbol, amount: pledgeOneSlashed}
        )
        verifyTransferEvents(redeemOneReceipt, [
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
            {symbol: debtSymbol, amount: pledgeTwo},
            {symbol: collateralSymbol, amount: pledgeTwoSlashed}
        )
        verifyTransferEvents(redeemTwoReceipt, [
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
            {symbol: debtSymbol, amount: pledgeThree},
            {symbol: collateralSymbol, amount: pledgeThreeSlashed}
        )
        verifyTransferEvents(redeemThreeReceipt, [
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

    async function slashCollateral(amount: bigint): Promise<ContractReceipt> {
        return successfulTransaction(bond.slash(amount))
    }

    async function allowRedemption(): Promise<ContractReceipt> {
        return successfulTransaction(bond.allowRedemption())
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
        factory: BondFactory,
        debtTokens: BigNumberish
    ): Promise<Bond> {
        const receipt = await execute(
            factory.createBond(
                'Special Debt Certificate',
                'SDC001',
                debtTokens,
                collateralSymbol,
                BOND_EXPIRY,
                MINIMUM_DEPOSIT,
                DATA
            )
        )
        const creationEvent = createBondEvent(event('CreateBond', receipt))
        const bondAddress = creationEvent.bond
        expect(ethers.utils.isAddress(bondAddress)).is.true

        return bondContractAt(bondAddress)
    }

    let admin: SignerWithAddress
    let bond: Bond
    let treasury: string
    let collateralTokens: ERC20
    let collateralSymbol: string
    let guarantorOne: SignerWithAddress
    let guarantorTwo: SignerWithAddress
    let guarantorThree: SignerWithAddress
    let bonds: BondFactory
})

function slash(amount: bigint, percent: bigint): bigint {
    return ((100n - percent) * amount) / 100n
}

type ExpectedBalance = {
    address: string | SignerWithAddress
    bond: bigint
    collateral: bigint
}

type GuarantorCollateralSetup = {
    signer: SignerWithAddress
    pledge: bigint
}

async function setupGuarantorWithCollateral(
    guarantor: GuarantorCollateralSetup,
    bond: Bond,
    collateral: ERC20
) {
    await collateral.transfer(guarantor.signer.address, guarantor.pledge)
    await collateral
        .connect(guarantor.signer)
        .increaseAllowance(bond.address, guarantor.pledge)
}

async function verifyBondAndCollateralBalances(
    balance: ExpectedBalance,
    collateral: ERC20,
    bond: Bond
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
