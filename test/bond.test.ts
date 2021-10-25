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
    events
} from './utils/events'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './utils/transaction'
import exp from 'constants'

// Wires up Waffle with Chai
chai.use(solidity)

const ZERO = 0n

describe('Bond contract', () => {
    before(async () => {
        admin = await signer(0)
        treasury = (await signer(1)).address
        securityAsset = await deployBitDao(admin)
        factory = await deployBondFactory(securityAsset.address, treasury)
        guarantorOne = await signer(2)
        guarantorTwo = await signer(3)
    })

    it('update the treasury address', async () => {
        const bond = await createBond(factory, 555666777n)

        const treasuryBefore = await bond.treasury()
        expect(treasuryBefore).equals(treasury)

        await bond.setTreasury(admin.address)
        const treasuryAfter = await bond.treasury()
        expect(treasuryAfter).equals(admin.address)
    })

    it('two guarantors who fully deposit, then fully redeem', async () => {
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
        expect(depositOneEvent.symbol).equals(debtSymbol)
        expect(depositOneEvent.amount).equals(guarantorOnePledge)

        // Guarantor Two deposits their full pledge amount
        const depositTwoReceipt = await successfulTransaction(
            bondGuarantorTwo.deposit(guarantorTwoPledge)
        )
        const depositTwoEvent = eventDebtCertificateIssue(
            event('DebtCertificateIssue', events(depositTwoReceipt))
        )
        expect(depositTwoEvent.receiver).equals(guarantorTwo.address)
        expect(depositTwoEvent.symbol).equals(debtSymbol)
        expect(depositTwoEvent.amount).equals(guarantorTwoPledge)

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
        expect(redemptionOneEvent.symbol).equals(securityAssetSymbol)
        expect(redemptionOneEvent.amount).equals(guarantorOnePledge)

        // Guarantor One redeem their bond in full
        const redeemTwoReceipt = await successfulTransaction(
            bondGuarantorTwo.redeem(guarantorTwoPledge)
        )

        const redemptionTwoEvent = eventRedemption(
            event('Redemption', events(redeemTwoReceipt))
        )
        expect(redemptionTwoEvent.redeemer).equals(guarantorTwo.address)
        expect(redemptionTwoEvent.symbol).equals(securityAssetSymbol)
        expect(redemptionTwoEvent.amount).equals(guarantorTwoPledge)

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

    let admin: SignerWithAddress
    let treasury: string
    let securityAsset: ERC20
    let guarantorOne: SignerWithAddress
    let guarantorTwo: SignerWithAddress
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
