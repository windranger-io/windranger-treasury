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
import {BigNumberish} from 'ethers'
import {
    event,
    allowRedemptionEvent,
    bondCreatedEvent,
    debtCertificateIssueEvent,
    redemptionEvent,
    events,
    slashEvent,
    transferEvent
} from './utils/events'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './utils/transaction'

// Wires up Waffle with Chai
chai.use(solidity)

const ZERO = 0n
const FORTY_PERCENT = 40n

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

    it('update the treasury address', async () => {
        const bond = await createBond(factory, 555666777n)

        const treasuryBefore = await bond.treasury()
        expect(treasuryBefore).equals(treasury)

        await bond.setTreasury(admin.address)
        const treasuryAfter = await bond.treasury()
        expect(treasuryAfter).equals(admin.address)
    })

    it('two guarantors fully deposit, then fully redeem', async () => {
        const guarantorOnePledge = 240050n
        const guarantorTwoPledge = 99500n
        const debtCertificates = guarantorOnePledge + guarantorTwoPledge
        const bond = await createBond(factory, debtCertificates)
        const debtSymbol = await bond.symbol()
        await setupGuarantorWithSecurityAsset(
            guarantorOne,
            guarantorOnePledge,
            bond
        )
        await setupGuarantorWithSecurityAsset(
            guarantorTwo,
            guarantorTwoPledge,
            bond
        )
        const bondGuarantorOne = bond.connect(guarantorOne)
        const bondGuarantorTwo = bond.connect(guarantorTwo)

        // Setup with each guarantor having only just enough funding
        expect(await bond.balanceOf(guarantorOne.address)).equals(ZERO)
        expect(await securityAsset.balanceOf(guarantorOne.address)).equals(
            guarantorOnePledge
        )
        expect(await bond.balanceOf(guarantorTwo.address)).equals(ZERO)
        expect(await securityAsset.balanceOf(guarantorTwo.address)).equals(
            guarantorTwoPledge
        )

        // Guarantor One deposits their full pledge amount
        const depositOneReceipt = await successfulTransaction(
            bondGuarantorOne.deposit(guarantorOnePledge)
        )
        const depositOneEvent = debtCertificateIssueEvent(
            event('DebtCertificateIssue', events(depositOneReceipt))
        )
        expect(depositOneEvent.receiver).equals(guarantorOne.address)
        expect(depositOneEvent.debSymbol).equals(debtSymbol)
        expect(depositOneEvent.debtAmount).equals(guarantorOnePledge)

        // Guarantor Two deposits their full pledge amount
        const depositTwoReceipt = await successfulTransaction(
            bondGuarantorTwo.deposit(guarantorTwoPledge)
        )
        const depositTwoEvent = debtCertificateIssueEvent(
            event('DebtCertificateIssue', events(depositTwoReceipt))
        )
        expect(depositTwoEvent.receiver).equals(guarantorTwo.address)
        expect(depositTwoEvent.debSymbol).equals(debtSymbol)
        expect(depositTwoEvent.debtAmount).equals(guarantorTwoPledge)

        // Balances have been updated in both the Bond and Security Asset
        expect(await bond.balanceOf(guarantorOne.address)).equals(
            guarantorOnePledge
        )
        expect(await securityAsset.balanceOf(guarantorOne.address)).equals(ZERO)
        expect(await bond.balanceOf(guarantorTwo.address)).equals(
            guarantorTwoPledge
        )
        expect(await securityAsset.balanceOf(guarantorTwo.address)).equals(ZERO)

        // Bond released by Owner
        const allowRedemptionReceipt = await successfulTransaction(
            bond.allowRedemption()
        )
        const allowRedemption = allowRedemptionEvent(
            event('AllowRedemption', events(allowRedemptionReceipt))
        )
        expect(allowRedemption.authorizer).equals(admin.address)

        // Guarantor One redeem their bond in full
        const redeemOneReceipt = await successfulTransaction(
            bondGuarantorOne.redeem(guarantorOnePledge)
        )
        const redemptionOneEvent = redemptionEvent(
            event('Redemption', events(redeemOneReceipt))
        )
        expect(redemptionOneEvent.redeemer).equals(guarantorOne.address)
        expect(redemptionOneEvent.debtSymbol).equals(debtSymbol)
        expect(redemptionOneEvent.debtAmount).equals(guarantorOnePledge)
        expect(redemptionOneEvent.securitySymbol).equals(securityAssetSymbol)
        expect(redemptionOneEvent.securityAmount).equals(guarantorOnePledge)

        // Guarantor Two redeem their bond in full
        const redeemTwoReceipt = await successfulTransaction(
            bondGuarantorTwo.redeem(guarantorTwoPledge)
        )

        const redemptionTwoEvent = redemptionEvent(
            event('Redemption', events(redeemTwoReceipt))
        )
        expect(redemptionTwoEvent.redeemer).equals(guarantorTwo.address)
        expect(redemptionTwoEvent.debtSymbol).equals(debtSymbol)
        expect(redemptionTwoEvent.debtAmount).equals(guarantorTwoPledge)
        expect(redemptionTwoEvent.securitySymbol).equals(securityAssetSymbol)
        expect(redemptionTwoEvent.securityAmount).equals(guarantorTwoPledge)

        // State is equivalent to the test beginning
        expect(await bond.balanceOf(guarantorOne.address)).equals(ZERO)
        expect(await securityAsset.balanceOf(guarantorOne.address)).equals(
            guarantorOnePledge
        )
        expect(await bond.balanceOf(guarantorTwo.address)).equals(ZERO)
        expect(await securityAsset.balanceOf(guarantorTwo.address)).equals(
            guarantorTwoPledge
        )
    })

    it('three guarantors fully deposit, partially slashed, then redeem', async () => {
        const guarantorOnePledge = 40050n
        const guarantorOneSlashed = slash(guarantorOnePledge, FORTY_PERCENT)
        const guarantorTwoPledge = 229500n
        const guarantorTwoSlashed = slash(guarantorTwoPledge, FORTY_PERCENT)
        const guarantorThreePledge = 667780n
        const guarantorThreeSlashed = slash(guarantorThreePledge, FORTY_PERCENT)
        const debtCertificates =
            guarantorOnePledge + guarantorTwoPledge + guarantorThreePledge
        const slashedSecurities =
            debtCertificates - slash(debtCertificates, FORTY_PERCENT)
        const bond = await createBond(factory, debtCertificates)
        const debtSymbol = await bond.symbol()
        await setupGuarantorWithSecurityAsset(
            guarantorOne,
            guarantorOnePledge,
            bond
        )
        await setupGuarantorWithSecurityAsset(
            guarantorTwo,
            guarantorTwoPledge,
            bond
        )
        await setupGuarantorWithSecurityAsset(
            guarantorThree,
            guarantorThreePledge,
            bond
        )
        const bondGuarantorOne = bond.connect(guarantorOne)
        const bondGuarantorTwo = bond.connect(guarantorTwo)
        const bondGuarantorThree = bond.connect(guarantorThree)

        // Setup with each guarantor having only just enough funding
        expect(await bond.balanceOf(guarantorOne.address)).equals(ZERO)
        expect(await securityAsset.balanceOf(guarantorOne.address)).equals(
            guarantorOnePledge
        )
        expect(await bond.balanceOf(guarantorTwo.address)).equals(ZERO)
        expect(await securityAsset.balanceOf(guarantorTwo.address)).equals(
            guarantorTwoPledge
        )
        expect(await bond.balanceOf(guarantorThree.address)).equals(ZERO)
        expect(await securityAsset.balanceOf(guarantorThree.address)).equals(
            guarantorThreePledge
        )

        // Guarantor One deposits their full pledge amount
        const depositOneReceipt = await successfulTransaction(
            bondGuarantorOne.deposit(guarantorOnePledge)
        )
        const depositOneEvent = debtCertificateIssueEvent(
            event('DebtCertificateIssue', events(depositOneReceipt))
        )
        expect(depositOneEvent.receiver).equals(guarantorOne.address)
        expect(depositOneEvent.debSymbol).equals(debtSymbol)
        expect(depositOneEvent.debtAmount).equals(guarantorOnePledge)

        // Guarantor Two deposits their full pledge amount
        const depositTwoReceipt = await successfulTransaction(
            bondGuarantorTwo.deposit(guarantorTwoPledge)
        )
        const depositTwoEvent = debtCertificateIssueEvent(
            event('DebtCertificateIssue', events(depositTwoReceipt))
        )
        expect(depositTwoEvent.receiver).equals(guarantorTwo.address)
        expect(depositTwoEvent.debSymbol).equals(debtSymbol)
        expect(depositTwoEvent.debtAmount).equals(guarantorTwoPledge)

        // Guarantor Three deposits their full pledge amount
        const depositThreeReceipt = await successfulTransaction(
            bondGuarantorThree.deposit(guarantorThreePledge)
        )
        const depositThreeEvent = debtCertificateIssueEvent(
            event('DebtCertificateIssue', events(depositThreeReceipt))
        )
        expect(depositThreeEvent.receiver).equals(guarantorThree.address)
        expect(depositThreeEvent.debSymbol).equals(debtSymbol)
        expect(depositThreeEvent.debtAmount).equals(guarantorThreePledge)

        // Balances have been updated in both the Bond and Security Asset
        expect(await bond.balanceOf(guarantorOne.address)).equals(
            guarantorOnePledge
        )
        expect(await securityAsset.balanceOf(guarantorOne.address)).equals(ZERO)
        expect(await bond.balanceOf(guarantorTwo.address)).equals(
            guarantorTwoPledge
        )
        expect(await securityAsset.balanceOf(guarantorThree.address)).equals(
            ZERO
        )
        expect(await bond.balanceOf(guarantorThree.address)).equals(
            guarantorThreePledge
        )
        expect(await securityAsset.balanceOf(guarantorThree.address)).equals(
            ZERO
        )
        expect(await bond.balanceOf(treasury)).equals(ZERO)
        expect(await securityAsset.balanceOf(treasury)).equals(ZERO)

        // Slash forty percent of the security assets
        const slashReceipt = await successfulTransaction(
            bond.slash(slashedSecurities)
        )
        const onlySlashEvent = slashEvent(event('Slash', events(slashReceipt)))
        expect(onlySlashEvent.securitySymbol).equals(securityAssetSymbol)
        expect(onlySlashEvent.securityAmount).equals(slashedSecurities)
        const onlyTransferEvent = transferEvent(
            event('Transfer', events(slashReceipt))
        )
        expect(onlyTransferEvent.from).equals(bond.address)
        expect(onlyTransferEvent.to).equals(treasury)
        expect(onlyTransferEvent.value).equals(slashedSecurities)

        expect(await bond.balanceOf(treasury)).equals(ZERO)
        expect(await securityAsset.balanceOf(treasury)).equals(
            slashedSecurities
        )
        // Bond released by Owner
        const allowRedemptionReceipt = await successfulTransaction(
            bond.allowRedemption()
        )
        const allowRedemption = allowRedemptionEvent(
            event('AllowRedemption', events(allowRedemptionReceipt))
        )
        expect(allowRedemption.authorizer).equals(admin.address)

        // Guarantor One redeem their slashed bond
        const redeemOneReceipt = await successfulTransaction(
            bondGuarantorOne.redeem(guarantorOnePledge)
        )
        const redemptionOneEvent = redemptionEvent(
            event('Redemption', events(redeemOneReceipt))
        )
        expect(redemptionOneEvent.redeemer).equals(guarantorOne.address)
        expect(redemptionOneEvent.debtSymbol).equals(debtSymbol)
        expect(redemptionOneEvent.debtAmount).equals(guarantorOnePledge)
        expect(redemptionOneEvent.securitySymbol).equals(securityAssetSymbol)
        expect(redemptionOneEvent.securityAmount).equals(guarantorOneSlashed)

        // Guarantor Two redeem their bond in full
        const redeemTwoReceipt = await successfulTransaction(
            bondGuarantorTwo.redeem(guarantorTwoPledge)
        )

        const redemptionTwoEvent = redemptionEvent(
            event('Redemption', events(redeemTwoReceipt))
        )
        expect(redemptionTwoEvent.redeemer).equals(guarantorTwo.address)
        expect(redemptionTwoEvent.debtSymbol).equals(debtSymbol)
        expect(redemptionTwoEvent.debtAmount).equals(guarantorTwoPledge)
        expect(redemptionTwoEvent.securitySymbol).equals(securityAssetSymbol)
        expect(redemptionTwoEvent.securityAmount).equals(guarantorTwoSlashed)

        // Guarantor Three redeem their bond in full
        const redeemThreeReceipt = await successfulTransaction(
            bondGuarantorThree.redeem(guarantorThreePledge)
        )

        const redemptionThreeEvent = redemptionEvent(
            event('Redemption', events(redeemThreeReceipt))
        )
        expect(redemptionThreeEvent.redeemer).equals(guarantorThree.address)
        expect(redemptionThreeEvent.debtSymbol).equals(debtSymbol)
        expect(redemptionThreeEvent.debtAmount).equals(guarantorThreePledge)
        expect(redemptionThreeEvent.securitySymbol).equals(securityAssetSymbol)
        expect(redemptionThreeEvent.securityAmount).equals(
            guarantorThreeSlashed
        )

        // State is equivalent to the test beginning
        expect(await bond.balanceOf(guarantorOne.address)).equals(ZERO)
        expect(await securityAsset.balanceOf(guarantorOne.address)).equals(
            guarantorOneSlashed
        )
        expect(await bond.balanceOf(guarantorTwo.address)).equals(ZERO)
        expect(await securityAsset.balanceOf(guarantorTwo.address)).equals(
            guarantorTwoSlashed
        )
        expect(await bond.balanceOf(guarantorThree.address)).equals(ZERO)
        expect(await securityAsset.balanceOf(guarantorThree.address)).equals(
            guarantorThreeSlashed
        )
        expect(await bond.balanceOf(treasury)).equals(ZERO)
        expect(await securityAsset.balanceOf(treasury)).equals(
            slashedSecurities
        )
    })

    async function setupGuarantorWithSecurityAsset(
        guarantor: SignerWithAddress,
        pledge: bigint,
        bond: Bond
    ) {
        await securityAsset.transfer(guarantor.address, pledge)
        await securityAsset
            .connect(guarantor)
            .increaseAllowance(bond.address, pledge)
    }

    let admin: SignerWithAddress
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
