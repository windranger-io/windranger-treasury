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
    ERC721PresetMinterPauserAutoId,
    ERC20PresetMinterPauser
} from '../typechain'
import {
    deployContract,
    deployContractWithProxy,
    execute,
    signer
} from './framework/contracts'
import {constants, ContractReceipt, Wallet} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {log} from '../config/logging'
import {
    verifyTransferEventLogs,
    verifyTransferEvents
} from './contracts/common/erc20-transfer'
import {successfulTransaction} from './framework/transaction'

// Wires up Waffle with Chai
chai.use(solidity)

const ADDRESS_ZERO = constants.AddressZero

describe('Token Sweep contracts', () => {
    let beneficary: string
    let erc20: ERC20PresetMinterPauser
    const erc20Symbol = 'TKN'
    const erc20Name = 'Test ERC20 Token'
    const erc721Symbol = 'TKN721'
    const erc721Name = 'Test ERC721 Token'
    const erc721URI = 'blah'
    let erc20SweepHarness: SweepERC20TokensHarness
    let erc721: ERC721PresetMinterPauserAutoId
    let erc721SweepHarness: SweepERC721TokensHarness
    before(async () => {
        beneficary = (await signer(2)).address
        log.info(`beneficiary: ${beneficary}`)
        erc20SweepHarness =
            await deployContractWithProxy<SweepERC20TokensHarness>(
                'SweepERC20TokensHarness'
                // [erc20Symbol, erc20Name]
            )
        log.info(`deployed at ${erc20SweepHarness.address}`)

        erc721SweepHarness =
            await deployContractWithProxy<SweepERC721TokensHarness>(
                'SweepERC721TokensHarness'
            )
        log.info(`deployed at ${erc721SweepHarness.address}`)

        erc20 = await deployContract<ERC20PresetMinterPauser>(
            'ERC20PresetMinterPauser',
            erc20Symbol,
            erc20Name
        )
        log.info(`erc20 deployed at ${erc20.address}`)
        erc721 = await deployContract<ERC721PresetMinterPauserAutoId>(
            'ERC721PresetMinterPauserAutoId',
            erc721Name,
            erc721Symbol,
            erc721URI
        )
        log.info(`erc721 deployed at ${erc721.address}`)
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

    describe.only('sweepERC20Tokens()', () => {
        const ERC20_TOKEN_AMOUNT = 100n
        before(async () => {
            await erc20SweepHarness.setBeneficiary(beneficary)
            await erc20.mint(erc20SweepHarness.address, ERC20_TOKEN_AMOUNT)
        })

        it('cannot sweep with zero address', async () => {
            await expect(
                erc20SweepHarness.sweepERC20Tokens(
                    ADDRESS_ZERO,
                    ERC20_TOKEN_AMOUNT
                )
            ).to.be.revertedWith('SweepERC20: null-token')
        })

        it('cannot sweep with self address', async () => {
            await expect(
                erc20SweepHarness.sweepERC20Tokens(
                    erc20SweepHarness.address,
                    ERC20_TOKEN_AMOUNT
                )
            ).to.be.revertedWith('SweepERC20: self-transfer')
        })

        async function sweepERC20Tokens(
            tokenAddress: string,
            amount: bigint
        ): Promise<ContractReceipt> {
            return successfulTransaction(
                erc20SweepHarness.sweepERC20Tokens(tokenAddress, amount)
            )
        }

        it.only('sweeps erroneously sent erc-20', async () => {
            /*
             * const balanceHarnessBefore = await erc20.balanceOf(
             *     erc20SweepHarness.address
             * )
             * const balanceBeneficiaryBefore = await erc20.balanceOf(beneficary)
             * expect(balanceBeneficiaryBefore).to.eq(0)
             * expect(balanceHarnessBefore).to.eq(ERC20_TOKEN_AMOUNT)
             */

            /*
             * await expect(
             *     await erc20SweepHarness.sweepERC20Tokens(
             *         erc20.address,
             *         ERC20_TOKEN_AMOUNT
             *     )
             * ).to.emit(erc20, 'Transfer')
             */
            log.info('sweep erc20 tokens at address: ', erc20.address)
            const receipt = await sweepERC20Tokens(
                erc20.address,
                ERC20_TOKEN_AMOUNT
            )

            verifyTransferEventLogs(
                [
                    {
                        from: erc20SweepHarness.address,
                        to: beneficary,
                        amount: ERC20_TOKEN_AMOUNT
                    }
                ],
                erc20SweepHarness,
                receipt
            )

            /*
             * const balanceHarnessAfter = await erc20.balanceOf(
             *     erc20SweepHarness.address
             * )
             * const balanceBeneficiaryAfter = await erc20.balanceOf(beneficary)
             * expect(balanceHarnessAfter).to.eq(0)
             * expect(balanceBeneficiaryAfter).to.eq(ERC20_TOKEN_AMOUNT)
             */
        })
    })

    describe('sweepERC721Tokens()', () => {
        before(async () => {
            await erc721SweepHarness.setBeneficiary(beneficary)
            await erc721.mint(erc721SweepHarness.address)
        })

        it('cannot sweep with zero address', async () => {
            await erc721SweepHarness.setBeneficiary((await signer(1)).address)
            await expect(
                erc721SweepHarness.sweepERC721Tokens(ADDRESS_ZERO, 0)
            ).to.be.revertedWith('SweepERC721: null-token')
        })

        it('cannot sweep with self address', async () => {
            await expect(
                erc721SweepHarness.sweepERC721Tokens(
                    erc721SweepHarness.address,
                    0
                )
            ).to.be.revertedWith('SweepERC721: self-transfer')
        })

        it('transfers trapped erc721', async () => {
            await expect(
                await erc721SweepHarness.sweepERC721Tokens(erc721.address, 0)
            ).to.emit(erc721, 'Transfer')
        })
    })
})
