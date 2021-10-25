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
    eventAllowRedemption,
    eventBondCreated,
    eventDebtCertificateIssue,
    eventRedemption,
    events,
    eventSlash,
    eventTransfer
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
        await securityAsset.transfer(guarantorOne.address, guarantorOnePledge)
        await securityAsset.transfer(guarantorTwo.address, guarantorTwoPledge)
        const securityAssetSymbol = await securityAsset.symbol()
        const bond = await createBond(factory, debtCertificates)
        const debtSymbol = await bond.symbol()
        const bondGuarantorOne = bond.connect(guarantorOne)
        const bondGuarantorTwo = bond.connect(guarantorTwo)
        await securityAsset
            .connect(guarantorOne)
            .increaseAllowance(bond.address, guarantorOnePledge)
        await securityAsset
            .connect(guarantorTwo)
            .increaseAllowance(bond.address, guarantorTwoPledge)

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
        const depositOneEvent = eventDebtCertificateIssue(
            event('DebtCertificateIssue', events(depositOneReceipt))
        )
        expect(depositOneEvent.receiver).equals(guarantorOne.address)
        expect(depositOneEvent.debSymbol).equals(debtSymbol)
        expect(depositOneEvent.debtAmount).equals(guarantorOnePledge)

        // Guarantor Two deposits their full pledge amount
        const depositTwoReceipt = await successfulTransaction(
            bondGuarantorTwo.deposit(guarantorTwoPledge)
        )
        const depositTwoEvent = eventDebtCertificateIssue(
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
        const allowRedemptionEvent = eventAllowRedemption(
            event('AllowRedemption', events(allowRedemptionReceipt))
        )
        expect(allowRedemptionEvent.authorizer).equals(admin.address)

        // Guarantor One redeem their bond in full
        const redeemOneReceipt = await successfulTransaction(
            bondGuarantorOne.redeem(guarantorOnePledge)
        )
        const redemptionOneEvent = eventRedemption(
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

        const redemptionTwoEvent = eventRedemption(
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
        await securityAsset.transfer(guarantorOne.address, guarantorOnePledge)
        await securityAsset.transfer(guarantorTwo.address, guarantorTwoPledge)
        await securityAsset.transfer(
            guarantorThree.address,
            guarantorThreePledge
        )
        const securityAssetSymbol = await securityAsset.symbol()
        const bond = await createBond(factory, debtCertificates)
        const debtSymbol = await bond.symbol()
        const bondGuarantorOne = bond.connect(guarantorOne)
        const bondGuarantorTwo = bond.connect(guarantorTwo)
        const bondGuarantorThree = bond.connect(guarantorThree)
        await securityAsset
            .connect(guarantorOne)
            .increaseAllowance(bond.address, guarantorOnePledge)
        await securityAsset
            .connect(guarantorTwo)
            .increaseAllowance(bond.address, guarantorTwoPledge)
        await securityAsset
            .connect(guarantorThree)
            .increaseAllowance(bond.address, guarantorThreePledge)

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
        const depositOneEvent = eventDebtCertificateIssue(
            event('DebtCertificateIssue', events(depositOneReceipt))
        )
        expect(depositOneEvent.receiver).equals(guarantorOne.address)
        expect(depositOneEvent.debSymbol).equals(debtSymbol)
        expect(depositOneEvent.debtAmount).equals(guarantorOnePledge)

        // Guarantor Two deposits their full pledge amount
        const depositTwoReceipt = await successfulTransaction(
            bondGuarantorTwo.deposit(guarantorTwoPledge)
        )
        const depositTwoEvent = eventDebtCertificateIssue(
            event('DebtCertificateIssue', events(depositTwoReceipt))
        )
        expect(depositTwoEvent.receiver).equals(guarantorTwo.address)
        expect(depositTwoEvent.debSymbol).equals(debtSymbol)
        expect(depositTwoEvent.debtAmount).equals(guarantorTwoPledge)

        // Guarantor Three deposits their full pledge amount
        const depositThreeReceipt = await successfulTransaction(
            bondGuarantorThree.deposit(guarantorThreePledge)
        )
        const depositThreeEvent = eventDebtCertificateIssue(
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
        const slashEvent = eventSlash(event('Slash', events(slashReceipt)))
        expect(slashEvent.securitySymbol).equals(securityAssetSymbol)
        expect(slashEvent.securityAmount).equals(slashedSecurities)
        const transferEvent = eventTransfer(
            event('Transfer', events(slashReceipt))
        )
        expect(transferEvent.from).equals(bond.address)
        expect(transferEvent.to).equals(treasury)
        expect(transferEvent.value).equals(slashedSecurities)

        expect(await bond.balanceOf(treasury)).equals(ZERO)
        expect(await securityAsset.balanceOf(treasury)).equals(
            slashedSecurities
        )
        // Bond released by Owner
        const allowRedemptionReceipt = await successfulTransaction(
            bond.allowRedemption()
        )
        const allowRedemptionEvent = eventAllowRedemption(
            event('AllowRedemption', events(allowRedemptionReceipt))
        )
        expect(allowRedemptionEvent.authorizer).equals(admin.address)

        // Guarantor One redeem their slashed bond
        const redeemOneReceipt = await successfulTransaction(
            bondGuarantorOne.redeem(guarantorOnePledge)
        )
        const redemptionOneEvent = eventRedemption(
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

        const redemptionTwoEvent = eventRedemption(
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

        const redemptionThreeEvent = eventRedemption(
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

        //TODO check treasury
    })

    let admin: SignerWithAddress
    let treasury: string
    let securityAsset: ERC20
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
    const creationEvent = eventBondCreated(
        event('BondCreated', events(receipt))
    )
    const bondAddress = creationEvent.bond
    expect(ethers.utils.isAddress(bondAddress)).is.true

    return bondContractAt(bondAddress)
}

function slash(amount: bigint, percent: bigint): bigint {
    return ((100n - percent) * amount) / 100n
}
