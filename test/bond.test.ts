// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {ethers} from 'hardhat'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BitDAO, Bond, BondFactory, ERC20} from '../typechain'
import {deployContract, execute, signer} from './utils/contracts'
import {BigNumberish, constants, ContractReceipt} from 'ethers'
import {
    event,
    bondCreatedEvent,
    events,
    verifyRedemptionEvent,
    verifyDebtIssueEvent,
    verifySlashEvent,
    verifyTransferEvent,
    verifyAllowRedemptionEvent,
    verifyWithdrawCollateralEvent,
    verifyFullCollateralEvent,
    verifyPartialCollateralEvent
} from './utils/events'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './utils/transaction'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero
const ZERO = 0n
const ONE = 1n
const FORTY_PERCENT = 40n
const FIFTY_PERCENT = 50n

describe('Bond contract', () => {
    before(async () => {
        admin = await signer(0)
        treasury = (await signer(1)).address
        guarantorOne = await signer(2)
        guarantorTwo = await signer(3)
        guarantorThree = await signer(4)
    })

    beforeEach(async () => {
        collateral = await deployContract<BitDAO>('BitDAO', admin.address)
        collateralSymbol = await collateral.symbol()
        factory = await deployContract<BondFactory>(
            'BondFactory',
            collateral.address,
            treasury
        )
    })

    describe('allow redemption', () => {
        it('changes state', async () => {
            bond = await createBond(factory, ONE)
            expect(await bond.redeemable()).is.false

            await bond.allowRedemption()

            expect(await bond.redeemable()).is.true
        })

        it('only when not paused', async () => {
            bond = await createBond(factory, ONE)
            await bond.pause()

            await expect(bond.allowRedemption()).to.be.revertedWith(
                'Pausable: paused'
            )
        })

        it('only when not redeemable', async () => {
            bond = await createBond(factory, ONE)
            await bond.allowRedemption()

            await expect(bond.allowRedemption()).to.be.revertedWith(
                'Bond::whenNotRedeemable: redeemable'
            )
        })

        it('only owner', async () => {
            bond = await createBond(factory, ONE)

            await expect(
                bond.connect(guarantorOne).allowRedemption()
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe('deposit', () => {
        it('cannot be zero', async () => {
            bond = await createBond(factory, 5566777n)

            await expect(bond.deposit(ZERO)).to.be.revertedWith(
                'Bond::deposit: too small'
            )
        })

        it('cannot be greater than available Debt Tokens', async () => {
            const debtTokens = 500000n
            bond = await createBond(factory, debtTokens)

            await expect(bond.deposit(debtTokens + 1n)).to.be.revertedWith(
                'Bond::deposit: too large'
            )
        })

        it('only when not paused', async () => {
            const pledge = 60n
            bond = await createBond(factory, pledge)
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
            bond = await createBond(factory, 235666777n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await allowRedemption()

            await expect(
                bond.connect(guarantorOne).deposit(pledge)
            ).to.be.revertedWith('Bond::whenNotRedeemable: redeemable')
        })
    })

    describe('init', () => {
        it('can only call once', async () => {
            bond = await createBond(factory, ONE)

            await expect(
                bond.initialize(
                    'My Debt Tokens one',
                    'MDT001',
                    ONE,
                    collateral.address,
                    treasury
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
                    collateral.address,
                    treasury
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
                    collateral.address,
                    ADDRESS_ZERO
                )
            ).to.be.revertedWith('Bond::init: treasury is zero address')
        })

        it('collateral tokens address cannot be zero', async () => {
            bond = await deployContract('Bond')

            await expect(
                bond.initialize(
                    'My Debt Tokens two',
                    'MDT002',
                    ONE,
                    ADDRESS_ZERO,
                    treasury
                )
            ).to.be.revertedWith(
                'Bond::init: collateral tokens is zero address'
            )
        })
    })

    describe('pause', () => {
        it('changes state', async () => {
            bond = await createBond(factory, ONE)
            expect(await bond.paused()).is.false

            await bond.pause()

            expect(await bond.paused()).is.true
        })

        it('only when not paused', async () => {
            bond = await createBond(factory, ONE)
            await bond.pause()

            await expect(bond.pause()).to.be.revertedWith('Pausable: paused')
        })

        it('only owner', async () => {
            bond = await createBond(factory, ONE)

            await expect(bond.connect(guarantorTwo).pause()).to.be.revertedWith(
                'Ownable: caller is not the owner'
            )
        })
    })

    describe('redeem', () => {
        it('cannot be zero', async () => {
            const pledge = 500n
            bond = await createBond(factory, 23336777n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await allowRedemption()

            await expect(redeem(guarantorOne, ZERO)).to.be.revertedWith(
                'Bond::redeem: too small'
            )
        })

        it('only when redeemable', async () => {
            const pledge = 500n
            bond = await createBond(factory, 238877n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(
                bond.connect(guarantorOne).redeem(pledge)
            ).to.be.revertedWith('Bond::whenRedeemable: not redeemable')
        })

        it('only when not paused', async () => {
            const pledge = 500n
            bond = await createBond(factory, 238877n)
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
            bond = await createBond(factory, debtTokens)
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
            bond = await createBond(factory, 2356666n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(bond.slash(ZERO)).to.be.revertedWith(
                'Bond::slash: too small'
            )
        })

        it('cannot be greater than collateral held', async () => {
            const pledge = 500n
            bond = await createBond(factory, 23563377n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(bond.slash(pledge + 1n)).to.be.revertedWith(
                'Bond::slash: greater than available collateral'
            )
        })

        it('ony when not redeemable', async () => {
            const pledge = 500n
            bond = await createBond(factory, 2356677n)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)
            await allowRedemption()

            await expect(bond.slash(pledge)).to.be.revertedWith(
                'Bond::whenNotRedeemable: redeemable'
            )
        })

        it('ony when not paused', async () => {
            const pledge = 500n
            bond = await createBond(factory, 2356677n)
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
            bond = await createBond(factory, 2356677n)
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
            bond = await createBond(factory, 555666777n)

            const treasuryBefore = await bond.treasury()
            expect(treasuryBefore).equals(treasury)

            await bond.setTreasury(admin.address)
            const treasuryAfter = await bond.treasury()
            expect(treasuryAfter).equals(admin.address)
        })
    })

    describe('unpause', () => {
        it('changes state', async () => {
            bond = await createBond(factory, ONE)
            await bond.pause()
            expect(await bond.paused()).is.true

            await bond.unpause()

            expect(await bond.paused()).is.false
        })

        it('only when paused', async () => {
            bond = await createBond(factory, ONE)

            await expect(bond.unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })

        it('only owner', async () => {
            bond = await createBond(factory, ONE)
            await bond.pause()

            await expect(
                bond.connect(guarantorTwo).unpause()
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe('withdraw collateral', () => {
        it('needs collateral remaining', async () => {
            bond = await createBond(factory, ONE)
            await setupGuarantorsWithCollateral([
                {signer: guarantorOne, pledge: ONE}
            ])
            await depositBond(guarantorOne, ONE)
            await allowRedemption()
            await redeem(guarantorOne, ONE)

            await expect(bond.withdrawCollateral()).to.be.revertedWith(
                'Bond::withdrawCollateral: no collateral remain'
            )
        })

        it('only when not paused', async () => {
            bond = await createBond(factory, ONE)
            await allowRedemption()
            await bond.pause()

            await expect(bond.withdrawCollateral()).to.be.revertedWith(
                'Pausable: paused'
            )
        })

        it('only when redeemable', async () => {
            bond = await createBond(factory, ONE)

            await expect(bond.withdrawCollateral()).to.be.revertedWith(
                'Bond::whenRedeemable: not redeemable'
            )
        })

        it('only owner', async () => {
            bond = await createBond(factory, ONE)
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
        bond = await createBond(factory, debtTokens)
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
        await verifyDebtIssueEvent(depositOne, guarantorOne.address, {
            symbol: debtSymbol,
            amount: pledge
        })
        await verifyFullCollateralEvent(depositOne, {
            symbol: collateralSymbol,
            amount: collateralAmount
        })

        // Bond holds all collateral, issued debt tokens
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: pledge},
            {address: guarantorOne, bond: debtTokens, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Slash all of the collateral assets
        const slashReceipt = await slashCollateral(slashedCollateral)
        await verifySlashEvent(slashReceipt, {
            symbol: collateralSymbol,
            amount: slashedCollateral
        })
        await verifyTransferEvent(slashReceipt, {
            from: bond.address,
            to: treasury,
            amount: slashedCollateral
        })

        // Debt holdings should remain the same, collateral moved
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: ZERO},
            {address: guarantorOne, bond: pledge, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: slashedCollateral}
        ])

        // Bond redemption allowed by Owner
        const allowRedemptionReceipt = await allowRedemption()
        await verifyAllowRedemptionEvent(allowRedemptionReceipt, admin.address)

        // Guarantor One redeem their bond, partial conversion (slashed)
        const redeemOneReceipt = await redeem(guarantorOne, pledge)
        await verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledge},
            {symbol: collateralSymbol, amount: ZERO}
        )

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
        bond = await createBond(factory, debtTokens)
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
        await verifyDebtIssueEvent(depositOne, guarantorOne.address, {
            symbol: debtSymbol,
            amount: pledge
        })

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
        await verifySlashEvent(slashReceipt, {
            symbol: collateralSymbol,
            amount: slashedCollateral
        })
        await verifyTransferEvent(slashReceipt, {
            from: bond.address,
            to: treasury,
            amount: slashedCollateral
        })

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
        await verifyAllowRedemptionEvent(allowRedemptionReceipt, admin.address)
        await verifyPartialCollateralEvent(
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
        await verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledge},
            {symbol: collateralSymbol, amount: pledge - slashedCollateral}
        )

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
        bond = await createBond(factory, debtTokens)
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
        await verifyDebtIssueEvent(depositOne, guarantorOne.address, {
            symbol: debtSymbol,
            amount: pledgeOne
        })

        // Guarantor Two deposits their full pledge amount
        const depositTwo = await depositBond(guarantorTwo, pledgeTwo)
        await verifyDebtIssueEvent(depositTwo, guarantorTwo.address, {
            symbol: debtSymbol,
            amount: pledgeTwo
        })
        await verifyFullCollateralEvent(depositTwo, {
            symbol: collateralSymbol,
            amount: collateralAmount
        })

        // Bond holds all collateral, issued debt tokens
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: debtTokens},
            {address: guarantorOne, bond: pledgeOne, collateral: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, collateral: ZERO},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])

        // Bond redemption allowed by Owner
        const allowRedemptionReceipt = await allowRedemption()
        await verifyAllowRedemptionEvent(allowRedemptionReceipt, admin.address)

        // Guarantor One redeem their bond, full conversion
        const redeemOneReceipt = await redeem(guarantorOne, pledgeOne)
        await verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledgeOne},
            {symbol: collateralSymbol, amount: pledgeOne}
        )

        // Guarantor Two redeem their bond, full conversion
        const redeemTwoReceipt = await redeem(guarantorTwo, pledgeTwo)
        await verifyRedemptionEvent(
            redeemTwoReceipt,
            guarantorTwo.address,
            {symbol: debtSymbol, amount: pledgeTwo},
            {symbol: collateralSymbol, amount: pledgeTwo}
        )

        // Guarantors redeemed their full pledge, no debt tokens remain
        await verifyBalances([
            {address: bond.address, bond: ZERO, collateral: ZERO},
            {address: guarantorOne, bond: ZERO, collateral: pledgeOne},
            {address: guarantorTwo, bond: ZERO, collateral: pledgeTwo},
            {address: treasury, bond: ZERO, collateral: ZERO}
        ])
    })

    it('two guarantors deposit partial collateral, then fully redeem', async () => {
        const pledgeOne = 30050n
        const pledgeTwo = 59500n
        const unmatchedPledge = 500n
        const debtTokens = pledgeOne + pledgeTwo + unmatchedPledge
        bond = await createBond(factory, debtTokens)
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
        await verifyDebtIssueEvent(depositOne, guarantorOne.address, {
            symbol: debtSymbol,
            amount: pledgeOne
        })

        // Guarantor Two deposits their full pledge amount
        const depositTwo = await depositBond(guarantorTwo, pledgeTwo)
        await verifyDebtIssueEvent(depositTwo, guarantorTwo.address, {
            symbol: debtSymbol,
            amount: pledgeTwo
        })

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
        await verifyAllowRedemptionEvent(allowRedemptionReceipt, admin.address)
        await verifyPartialCollateralEvent(
            allowRedemptionReceipt,
            {symbol: collateralSymbol, amount: pledgeOne + pledgeTwo},
            {symbol: debtSymbol, amount: unmatchedPledge}
        )

        // Guarantor One redeem their bond, full conversion
        const redeemOneReceipt = await redeem(guarantorOne, pledgeOne)
        await verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledgeOne},
            {symbol: collateralSymbol, amount: pledgeOne}
        )

        // Guarantor Two redeem their bond, full conversion
        const redeemTwoReceipt = await redeem(guarantorTwo, pledgeTwo)
        await verifyRedemptionEvent(
            redeemTwoReceipt,
            guarantorTwo.address,
            {symbol: debtSymbol, amount: pledgeTwo},
            {symbol: collateralSymbol, amount: pledgeTwo}
        )

        // Guarantors redeemed their full pledge, unmatched debt tokens remain
        await verifyBalances([
            {address: bond.address, bond: unmatchedPledge, collateral: ZERO},
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
        bond = await createBond(factory, debtTokens)
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
        await verifyWithdrawCollateralEvent(withdrawReceipt, {
            to: treasury,
            symbol: collateralSymbol,
            amount: ONE
        })
        await verifyTransferEvent(withdrawReceipt, {
            from: bond.address,
            to: treasury,
            amount: ONE
        })

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
        bond = await createBond(factory, debtTokens)
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
        await verifyDebtIssueEvent(depositOne, guarantorOne.address, {
            symbol: debtSymbol,
            amount: pledgeOne
        })

        // Guarantor Two deposits their full pledge amount
        const depositTwo = await depositBond(guarantorTwo, pledgeTwo)
        await verifyDebtIssueEvent(depositTwo, guarantorTwo.address, {
            symbol: debtSymbol,
            amount: pledgeTwo
        })

        // Guarantor Three deposits their full pledge amount
        const depositThree = await depositBond(guarantorThree, pledgeThree)
        await verifyDebtIssueEvent(depositThree, guarantorThree.address, {
            symbol: debtSymbol,
            amount: pledgeThree
        })

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
        await verifySlashEvent(slashReceipt, {
            symbol: collateralSymbol,
            amount: slashedCollateral
        })
        await verifyTransferEvent(slashReceipt, {
            from: bond.address,
            to: treasury,
            amount: slashedCollateral
        })

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
        await verifyAllowRedemptionEvent(allowRedemptionReceipt, admin.address)

        // Guarantor One redeem their bond, partial conversion (slashed)
        const redeemOneReceipt = await redeem(guarantorOne, pledgeOne)
        await verifyRedemptionEvent(
            redeemOneReceipt,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledgeOne},
            {symbol: collateralSymbol, amount: pledgeOneSlashed}
        )

        // Guarantor Two redeem their bond, partial conversion (slashed)
        const redeemTwoReceipt = await redeem(guarantorTwo, pledgeTwo)
        await verifyRedemptionEvent(
            redeemTwoReceipt,
            guarantorTwo.address,
            {symbol: debtSymbol, amount: pledgeTwo},
            {symbol: collateralSymbol, amount: pledgeTwoSlashed}
        )

        // Guarantor Three redeem their bond, partial conversion (slashed)
        const redeemThreeReceipt = await redeem(guarantorThree, pledgeThree)
        await verifyRedemptionEvent(
            redeemThreeReceipt,
            guarantorThree.address,
            {symbol: debtSymbol, amount: pledgeThree},
            {symbol: collateralSymbol, amount: pledgeThreeSlashed}
        )

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
            await verifyBondAndCollateralBalances(balances[i], collateral, bond)
        }
    }

    async function setupGuarantorsWithCollateral(
        guarantors: GuarantorCollateralSetup[]
    ): Promise<void> {
        for (let i = 0; i < guarantors.length; i++) {
            await setupGuarantorWithCollateral(guarantors[i], bond, collateral)
        }
    }

    let admin: SignerWithAddress
    let bond: Bond
    let treasury: string
    let collateral: ERC20
    let collateralSymbol: string
    let guarantorOne: SignerWithAddress
    let guarantorTwo: SignerWithAddress
    let guarantorThree: SignerWithAddress
    let factory: BondFactory
})

export async function bondContractAt(address: string): Promise<Bond> {
    const factory = await ethers.getContractFactory('Bond')
    return <Bond>factory.attach(address)
}

async function createBond(
    factory: BondFactory,
    debtTokens: BigNumberish
): Promise<Bond> {
    const receipt = await execute(
        factory.createBond('Special Debt Certificate', 'SDC001', debtTokens)
    )
    const creationEvent = bondCreatedEvent(
        event('BondCreated', events(receipt))
    )
    const bondAddress = creationEvent.bond
    expect(ethers.utils.isAddress(bondAddress)).is.true

    return bondContractAt(bondAddress)
}

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
