// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {ethers} from 'hardhat'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {Bond, BondFactory, ERC20} from '../typechain'
import {
    bondContractAt,
    deployBitDao,
    deployBondFactory,
    execute,
    signer
} from './utils/contracts'
import {BigNumberish, ContractReceipt} from 'ethers'
import {
    event,
    bondCreatedEvent,
    events,
    verifyRedemptionEvent,
    verifyDebtCertificateIssueEvent,
    verifySlashEvent,
    verifyTransferEvent,
    verifyAllowRedemptionEvent
} from './utils/events'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './utils/transaction'

// Wires up Waffle with Chai
chai.use(solidity)

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
        securityAsset = await deployBitDao(admin)
        securityAssetSymbol = await securityAsset.symbol()
        factory = await deployBondFactory(securityAsset.address, treasury)
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

    describe('close', () => {
        it('cannot have outstanding Debt Certificates', async () => {
            bond = await createBond(factory, ONE)
            await setupGuarantorsWithSecurity([
                {signer: guarantorOne, pledge: ONE}
            ])
            await depositBond(guarantorOne, ONE)
            await allowRedemption()

            await expect(bond.close()).to.be.revertedWith(
                'Bond::close: debt certificates outstanding'
            )
        })

        it('needs securities remaining', async () => {
            bond = await createBond(factory, ONE)
            await setupGuarantorsWithSecurity([
                {signer: guarantorOne, pledge: ONE}
            ])
            await depositBond(guarantorOne, ONE)
            await allowRedemption()
            await redeem(guarantorOne, ONE)

            await expect(bond.close()).to.be.revertedWith(
                'Bond::close: no securities remain'
            )
        })

        it('only when not paused', async () => {
            bond = await createBond(factory, ONE)
            await allowRedemption()
            await bond.pause()

            await expect(bond.close()).to.be.revertedWith('Pausable: paused')
        })

        it('only when redeemable', async () => {
            bond = await createBond(factory, ONE)

            await expect(bond.close()).to.be.revertedWith(
                'Bond::whenRedeemable: not redeemable'
            )
        })

        it('only owner', async () => {
            bond = await createBond(factory, ONE)
            await allowRedemption()

            await expect(bond.connect(guarantorOne).close()).to.be.revertedWith(
                'Ownable: caller is not the owner'
            )
        })
    })

    describe('deposit', () => {
        it('cannot be zero', async () => {
            bond = await createBond(factory, 5566777n)

            await expect(bond.deposit(ZERO)).to.be.revertedWith(
                'Bond::deposit: too small'
            )
        })

        it('cannot be greater than available Debt Certificates', async () => {
            const debtCertificates = 500000n
            bond = await createBond(factory, debtCertificates)

            await expect(
                bond.deposit(debtCertificates + 1n)
            ).to.be.revertedWith('Bond::deposit: too large')
        })

        it('only when not paused', async () => {
            const pledge = 60n
            bond = await createBond(factory, pledge)
            await setupGuarantorsWithSecurity([
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
            await setupGuarantorsWithSecurity([
                {signer: guarantorOne, pledge: pledge}
            ])
            await allowRedemption()

            await expect(
                bond.connect(guarantorOne).deposit(pledge)
            ).to.be.revertedWith('Bond::whenNotRedeemable: redeemable')
        })
    })

    describe('mint', () => {
        it('cannot be zero', async () => {
            bond = await createBond(factory, 23566337n)

            await expect(bond.mint(ZERO)).to.be.revertedWith(
                'Bond::mint: too small'
            )
        })

        it('only when not paused', async () => {
            bond = await createBond(factory, ONE)
            await bond.pause()

            await expect(bond.mint(ONE)).to.be.revertedWith('Pausable: paused')
        })

        it('only when not redeemable', async () => {
            bond = await createBond(factory, ONE)
            await allowRedemption()

            await expect(bond.mint(ONE)).to.be.revertedWith(
                'Bond::whenNotRedeemable: redeemable'
            )
        })

        it('only owner', async () => {
            bond = await createBond(factory, ONE)

            await expect(
                bond.connect(guarantorOne).mint(ONE)
            ).to.be.revertedWith('Ownable: caller is not the owner')
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
            await setupGuarantorsWithSecurity([
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
            await setupGuarantorsWithSecurity([
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
            await setupGuarantorsWithSecurity([
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
            const debtCertificates = pledge
            const oneThirdOfSlash = 100n
            const slashAmount = 3n * oneThirdOfSlash
            const remainingSecurity = pledge - slashAmount
            bond = await createBond(factory, debtCertificates)
            await setupGuarantorsWithSecurity([
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
                    security: remainingSecurity
                },
                {address: guarantorOne, bond: debtCertificates, security: ZERO},
                {address: treasury, bond: ZERO, security: slashAmount}
            ])
        })

        it('cannot be zero', async () => {
            const pledge = 500n
            bond = await createBond(factory, 2356666n)
            await setupGuarantorsWithSecurity([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(bond.slash(ZERO)).to.be.revertedWith(
                'Bond::slash: too small'
            )
        })

        it('cannot be greater than securities held', async () => {
            const pledge = 500n
            bond = await createBond(factory, 23563377n)
            await setupGuarantorsWithSecurity([
                {signer: guarantorOne, pledge: pledge}
            ])
            await depositBond(guarantorOne, pledge)

            await expect(bond.slash(pledge + 1n)).to.be.revertedWith(
                'Bond::slash: greater than available security supply'
            )
        })

        it('ony when not redeemable', async () => {
            const pledge = 500n
            bond = await createBond(factory, 2356677n)
            await setupGuarantorsWithSecurity([
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
            await setupGuarantorsWithSecurity([
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
            await setupGuarantorsWithSecurity([
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

    it('one guarantor deposit, then is fully slashed', async () => {
        const pledge = 40050n
        const debtCertificates = pledge
        const slashedSecurities = debtCertificates
        bond = await createBond(factory, debtCertificates)
        const debtSymbol = await bond.symbol()
        await setupGuarantorsWithSecurity([
            {signer: guarantorOne, pledge: pledge}
        ])

        // Each Guarantor has their full security amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtCertificates, security: ZERO},
            {address: guarantorOne, bond: ZERO, security: pledge},
            {address: treasury, bond: ZERO, security: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledge)
        await verifyDebtCertificateIssueEvent(
            depositOne,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledge}
        )

        // Bond holds all securities, issued debt certificates
        await verifyBalances([
            {address: bond.address, bond: ZERO, security: pledge},
            {address: guarantorOne, bond: debtCertificates, security: ZERO},
            {address: treasury, bond: ZERO, security: ZERO}
        ])

        // Slash forty percent of the security assets
        const slashReceipt = await slashSecurities(slashedSecurities)
        await verifySlashEvent(slashReceipt, {
            symbol: securityAssetSymbol,
            amount: slashedSecurities
        })
        await verifyTransferEvent(slashReceipt, {
            from: bond.address,
            to: treasury,
            amount: slashedSecurities
        })

        // Debt holdings should remain the same, securities moved
        await verifyBalances([
            {address: bond.address, bond: ZERO, security: ZERO},
            {address: guarantorOne, bond: pledge, security: ZERO},
            {address: treasury, bond: ZERO, security: slashedSecurities}
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
            {symbol: securityAssetSymbol, amount: ZERO}
        )

        // Slashed securities in Treasury, Guarantors redeemed, no debt remain
        await verifyBalances([
            {address: bond.address, bond: ZERO, security: ZERO},
            {address: guarantorOne, bond: ZERO, security: ZERO},
            {address: treasury, bond: ZERO, security: slashedSecurities}
        ])
    })

    it('two guarantors deposit, then fully redeem', async () => {
        const pledgeOne = 240050n
        const pledgeTwo = 99500n
        const debtCertificates = pledgeOne + pledgeTwo
        bond = await createBond(factory, debtCertificates)
        const debtSymbol = await bond.symbol()
        await setupGuarantorsWithSecurity([
            {signer: guarantorOne, pledge: pledgeOne},
            {signer: guarantorTwo, pledge: pledgeTwo}
        ])

        // Each Guarantor has their full security amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtCertificates, security: ZERO},
            {address: guarantorOne, bond: ZERO, security: pledgeOne},
            {address: guarantorTwo, bond: ZERO, security: pledgeTwo},
            {address: treasury, bond: ZERO, security: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledgeOne)
        await verifyDebtCertificateIssueEvent(
            depositOne,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledgeOne}
        )

        // Guarantor Two deposits their full pledge amount
        const depositTwo = await depositBond(guarantorTwo, pledgeTwo)
        await verifyDebtCertificateIssueEvent(
            depositTwo,
            guarantorTwo.address,
            {symbol: debtSymbol, amount: pledgeTwo}
        )

        // Bond holds all securities, issued debt certificates
        await verifyBalances([
            {address: bond.address, bond: ZERO, security: debtCertificates},
            {address: guarantorOne, bond: pledgeOne, security: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, security: ZERO},
            {address: treasury, bond: ZERO, security: ZERO}
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
            {symbol: securityAssetSymbol, amount: pledgeOne}
        )

        // Guarantor Two redeem their bond, full conversion
        const redeemTwoReceipt = await redeem(guarantorTwo, pledgeTwo)
        await verifyRedemptionEvent(
            redeemTwoReceipt,
            guarantorTwo.address,
            {symbol: debtSymbol, amount: pledgeTwo},
            {symbol: securityAssetSymbol, amount: pledgeTwo}
        )

        // Guarantors redeemed their full pledge, no debt certificates remain
        await verifyBalances([
            {address: bond.address, bond: ZERO, security: ZERO},
            {address: guarantorOne, bond: ZERO, security: pledgeOne},
            {address: guarantorTwo, bond: ZERO, security: pledgeTwo},
            {address: treasury, bond: ZERO, security: ZERO}
        ])
    })

    it('one guarantor deposit, are partially slashed, then redeems, leaving a se security due to rounding', async () => {
        const pledge = 12345n
        const pledgeSlashed = slash(pledge, FIFTY_PERCENT)
        const debtCertificates = pledge
        const slashedSecurities =
            debtCertificates - slash(debtCertificates, FIFTY_PERCENT)
        bond = await createBond(factory, debtCertificates)
        await setupGuarantorsWithSecurity([
            {signer: guarantorOne, pledge: pledge}
        ])
        await depositBond(guarantorOne, pledge)
        await slashSecurities(slashedSecurities)
        await allowRedemption()
        await redeem(guarantorOne, pledge)
        const pledgeSlashedFloored = pledgeSlashed - ONE

        // Slashed securities in Treasury, Guarantors redeemed, no debt remain
        await verifyBalances([
            {address: bond.address, bond: ZERO, security: ONE},
            {address: guarantorOne, bond: ZERO, security: pledgeSlashedFloored},
            {address: treasury, bond: ZERO, security: slashedSecurities}
        ])

        // Move the rounding error from the Bond contract to the Treasury
        const closeReceipt = await close()
        await verifyTransferEvent(closeReceipt, {
            from: bond.address,
            to: treasury,
            amount: ONE
        })

        // Nothing in bond, with the rounding error now in the Treasury
        await verifyBalances([
            {address: bond.address, bond: ZERO, security: ZERO},
            {address: guarantorOne, bond: ZERO, security: pledgeSlashedFloored},
            {address: treasury, bond: ZERO, security: slashedSecurities + ONE}
        ])
    })

    it('three guarantors deposit, are partially slashed, then redeems', async () => {
        const pledgeOne = 40050n
        const pledgeOneSlashed = slash(pledgeOne, FORTY_PERCENT)
        const pledgeTwo = 229500n
        const pledgeTwoSlashed = slash(pledgeTwo, FORTY_PERCENT)
        const pledgeThree = 667780n
        const pledgeThreeSlashed = slash(pledgeThree, FORTY_PERCENT)
        const debtCertificates = pledgeOne + pledgeTwo + pledgeThree
        const slashedSecurities =
            debtCertificates - slash(debtCertificates, FORTY_PERCENT)
        const remainingSecurities = debtCertificates - slashedSecurities
        bond = await createBond(factory, debtCertificates)
        const debtSymbol = await bond.symbol()
        await setupGuarantorsWithSecurity([
            {signer: guarantorOne, pledge: pledgeOne},
            {signer: guarantorTwo, pledge: pledgeTwo},
            {signer: guarantorThree, pledge: pledgeThree}
        ])

        // Each Guarantor has their full security amount (their pledge)
        await verifyBalances([
            {address: bond.address, bond: debtCertificates, security: ZERO},
            {address: guarantorOne, bond: ZERO, security: pledgeOne},
            {address: guarantorTwo, bond: ZERO, security: pledgeTwo},
            {address: guarantorThree, bond: ZERO, security: pledgeThree},
            {address: treasury, bond: ZERO, security: ZERO}
        ])

        // Guarantor One deposits their full pledge amount
        const depositOne = await depositBond(guarantorOne, pledgeOne)
        await verifyDebtCertificateIssueEvent(
            depositOne,
            guarantorOne.address,
            {symbol: debtSymbol, amount: pledgeOne}
        )

        // Guarantor Two deposits their full pledge amount
        const depositTwo = await depositBond(guarantorTwo, pledgeTwo)
        await verifyDebtCertificateIssueEvent(
            depositTwo,
            guarantorTwo.address,
            {symbol: debtSymbol, amount: pledgeTwo}
        )

        // Guarantor Three deposits their full pledge amount
        const depositThree = await depositBond(guarantorThree, pledgeThree)
        await verifyDebtCertificateIssueEvent(
            depositThree,
            guarantorThree.address,
            {symbol: debtSymbol, amount: pledgeThree}
        )

        // Bond holds all securities, issued debt certificates
        await verifyBalances([
            {address: bond.address, bond: ZERO, security: debtCertificates},
            {address: guarantorOne, bond: pledgeOne, security: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, security: ZERO},
            {address: guarantorThree, bond: pledgeThree, security: ZERO},
            {address: treasury, bond: ZERO, security: ZERO}
        ])

        // Slash forty percent from the security assets
        const slashReceipt = await slashSecurities(slashedSecurities)
        await verifySlashEvent(slashReceipt, {
            symbol: securityAssetSymbol,
            amount: slashedSecurities
        })
        await verifyTransferEvent(slashReceipt, {
            from: bond.address,
            to: treasury,
            amount: slashedSecurities
        })

        // Debt holdings should remain the same, only securities moved
        await verifyBalances([
            {address: bond.address, bond: ZERO, security: remainingSecurities},
            {address: guarantorOne, bond: pledgeOne, security: ZERO},
            {address: guarantorTwo, bond: pledgeTwo, security: ZERO},
            {address: guarantorThree, bond: pledgeThree, security: ZERO},
            {address: treasury, bond: ZERO, security: slashedSecurities}
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
            {symbol: securityAssetSymbol, amount: pledgeOneSlashed}
        )

        // Guarantor Two redeem their bond, partial conversion (slashed)
        const redeemTwoReceipt = await redeem(guarantorTwo, pledgeTwo)
        await verifyRedemptionEvent(
            redeemTwoReceipt,
            guarantorTwo.address,
            {symbol: debtSymbol, amount: pledgeTwo},
            {symbol: securityAssetSymbol, amount: pledgeTwoSlashed}
        )

        // Guarantor Three redeem their bond, partial conversion (slashed)
        const redeemThreeReceipt = await redeem(guarantorThree, pledgeThree)
        await verifyRedemptionEvent(
            redeemThreeReceipt,
            guarantorThree.address,
            {symbol: debtSymbol, amount: pledgeThree},
            {symbol: securityAssetSymbol, amount: pledgeThreeSlashed}
        )

        // Slashed securities in Treasury, Guarantors redeemed, no debt remain
        await verifyBalances([
            {address: bond.address, bond: ZERO, security: ZERO},
            {address: guarantorOne, bond: ZERO, security: pledgeOneSlashed},
            {address: guarantorTwo, bond: ZERO, security: pledgeTwoSlashed},
            {address: guarantorThree, bond: ZERO, security: pledgeThreeSlashed},
            {address: treasury, bond: ZERO, security: slashedSecurities}
        ])
    })

    async function redeem(
        guarantor: SignerWithAddress,
        amount: bigint
    ): Promise<ContractReceipt> {
        return successfulTransaction(bond.connect(guarantor).redeem(amount))
    }

    async function slashSecurities(amount: bigint): Promise<ContractReceipt> {
        return successfulTransaction(bond.slash(amount))
    }

    async function allowRedemption(): Promise<ContractReceipt> {
        return successfulTransaction(bond.allowRedemption())
    }

    async function close(): Promise<ContractReceipt> {
        return successfulTransaction(bond.close())
    }

    async function depositBond(
        guarantor: SignerWithAddress,
        pledge: bigint
    ): Promise<ContractReceipt> {
        return successfulTransaction(bond.connect(guarantor).deposit(pledge))
    }

    async function verifyBalances(balances: ExpectedBalance[]): Promise<void> {
        for (let i = 0; i < balances.length; i++) {
            await verifyBondAndSecurityBalances(
                balances[i],
                securityAsset,
                bond
            )
        }
    }

    async function setupGuarantorsWithSecurity(
        guarantors: GuarantorSecuritySetup[]
    ): Promise<void> {
        for (let i = 0; i < guarantors.length; i++) {
            await setupGuarantorWithSecurity(guarantors[i], bond, securityAsset)
        }
    }

    let admin: SignerWithAddress
    let bond: Bond
    let treasury: string
    let securityAsset: ERC20
    let securityAssetSymbol: string
    let guarantorOne: SignerWithAddress
    let guarantorTwo: SignerWithAddress
    let guarantorThree: SignerWithAddress
    let factory: BondFactory
})

async function createBond(
    factory: BondFactory,
    debtCertificates: BigNumberish
): Promise<Bond> {
    const receipt = await execute(
        factory.createBond(
            debtCertificates,
            'Special Debt Certificate',
            'SDC001'
        )
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
    security: bigint
}

type GuarantorSecuritySetup = {
    signer: SignerWithAddress
    pledge: bigint
}

async function setupGuarantorWithSecurity(
    guarantor: GuarantorSecuritySetup,
    bond: Bond,
    security: ERC20
) {
    await security.transfer(guarantor.signer.address, guarantor.pledge)
    await security
        .connect(guarantor.signer)
        .increaseAllowance(bond.address, guarantor.pledge)
}

async function verifyBondAndSecurityBalances(
    balance: ExpectedBalance,
    security: ERC20,
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
        await security.balanceOf(address),
        'Security balance for ' + address
    ).equals(balance.security)
}
