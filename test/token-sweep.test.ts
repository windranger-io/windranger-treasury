// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    SweepERC20TokensHarness,
    SweepERC721TokensHarness,
    IERC721,
    ERC20
} from '../typechain'
import {
    deployContract,
    deployContractWithProxy,
    execute,
    signer
} from './framework/contracts'
import {constants, Wallet} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {log} from '../config/logging'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero

describe.only('Token Sweep contracts', () => {
    let deployer: string
    let erc20: ERC20
    let erc20Symbol: string
    let erc20SweepHarness: SweepERC20TokensHarness
    let erc721: ERC20
    let erc721Name: string
    let erc721SweepHarness: SweepERC721TokensHarness
    before(async () => {
        erc20SweepHarness =
            await deployContractWithProxy<SweepERC20TokensHarness>(
                'SweepERC20TokensHarness'
            )
        log.info(`deployed at ${erc20SweepHarness.address}`)

        erc721SweepHarness =
            await deployContractWithProxy<SweepERC721TokensHarness>(
                'SweepERC721TokensHarness'
            )
        log.info(`deployed at ${erc721SweepHarness.address}`)
    })
    describe('setBeneficiary()', () => {
        it('updates the beneficiary address', async () => {
            const newBeneficiary = await signer(1)
            await expect(
                await erc20SweepHarness.setBeneficiary(newBeneficiary.address)
            ).to.emit(erc20SweepHarness, 'BeneficiaryUpdated')
        })

        it('cannot set zero address as beneficiary', async () => {
            await expect(
                erc20SweepHarness.setBeneficiary(ADDRESS_ZERO)
            ).to.be.revertedWith('BaseTokenSweep: beneficiary-zero')
        })

        it('cannot set self as beneficiary', async () => {
            await expect(
                erc20SweepHarness.setBeneficiary(erc20SweepHarness.address)
            ).to.be.revertedWith('BaseTokenSweep: self-address')
        })

        it('cannot update to self', async () => {
            const randomAddress = Wallet.createRandom().address
            await erc20SweepHarness.setBeneficiary(randomAddress)
            await expect(
                erc20SweepHarness.setBeneficiary(randomAddress)
            ).to.be.revertedWith('BaseTokenSweep: not-updating')
        })
    })
})
