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
    connectBond,
    deployBitDao,
    deployBondFactory,
    execute,
    signer
} from './utils/contracts'
import {BigNumberish} from 'ethers'
import {validateBondCreateEvent, validateEvents} from './utils/events'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'

// Wires up Waffle with Chai
chai.use(solidity)

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

    it('two guarantors who fully deposit, then fully withdraw', async () => {
        const guarantorOnePledge = 240050n
        const guarantorTwoPledge = 99500n
        const debtCertificates = guarantorOnePledge + guarantorTwoPledge
        const bond = await createBond(factory, debtCertificates)

        //TODO parse the response for the expected events - all calls

        await securityAsset.transfer(guarantorOne.address, guarantorOnePledge)
        await securityAsset.transfer(guarantorTwo.address, guarantorTwoPledge)

        await securityAsset
            .connect(guarantorOne)
            .increaseAllowance(bond.address, guarantorOnePledge)

        await bond.connect(guarantorOne).deposit(guarantorOnePledge)

        await securityAsset
            .connect(guarantorTwo)
            .increaseAllowance(bond.address, guarantorTwoPledge)
        await bond.connect(guarantorTwo).deposit(guarantorTwoPledge)

        //TODO check balances (debt & security

        await bond.connect(admin).allowRedemption()

        const bondBalance = await securityAsset.balanceOf(bond.address)
        const bondSupply = await bond.totalSupply()

        await bond.connect(guarantorOne).redeem(guarantorOnePledge)
        await bond.connect(guarantorTwo).redeem(guarantorTwoPledge)

        //TODO check balances (debt & security
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
    const events = validateEvents(receipt)
    expect(events.length).equals(4)
    const creationEvent = validateBondCreateEvent(events[3]).args

    const bondAddress = creationEvent.bond
    expect(ethers.utils.isAddress(bondAddress)).is.true

    return connectBond(bondAddress)
}
