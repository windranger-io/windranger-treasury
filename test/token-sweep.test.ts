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
    signer
} from './framework/contracts'
import {constants, ContractReceipt, Wallet} from 'ethers'
import {log} from '../config/logging'
import {verifyERC20TransferEventLogs} from './contracts/common/verify-erc20-transfer'
import {successfulTransaction} from './framework/transaction'
import {verifyERC721TransferEventLogs} from './contracts/common/verify-erc721-transfer'

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

    describe('sweepERC20Tokens()', () => {
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

        it('sweeps erroneously sent erc-20', async () => {
            const receipt = await sweepERC20Tokens(
                erc20.address,
                ERC20_TOKEN_AMOUNT
            )

            verifyERC20TransferEventLogs(
                [
                    {
                        from: erc20SweepHarness.address,
                        to: beneficary,
                        amount: ERC20_TOKEN_AMOUNT
                    }
                ],
                erc20,
                receipt
            )
        })
    })

    describe('sweepERC721Tokens()', () => {
        before(async () => {
            await erc721SweepHarness.setBeneficiary(beneficary)
            await erc721.mint(erc721SweepHarness.address)
        })

        it('cannot sweep with zero address', async () => {
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

        async function sweepERC721Tokens(
            tokenAddress: string,
            tokenId: bigint
        ): Promise<ContractReceipt> {
            return successfulTransaction(
                erc721SweepHarness.sweepERC721Tokens(tokenAddress, tokenId)
            )
        }

        it('transfers trapped erc721', async () => {
            const receipt = await sweepERC721Tokens(erc721.address, BigInt(0))

            verifyERC721TransferEventLogs(
                [
                    {
                        from: erc721SweepHarness.address,
                        to: beneficary,
                        tokenId: BigInt(0)
                    }
                ],
                erc721,
                receipt
            )
        })
    })
})
