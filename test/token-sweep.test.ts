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
import {constants} from 'ethers'
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
    })
    it('deploys', () => {
        log.info(`deployed at ${erc20SweepHarness.address}`)
    })
})
