import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ethers} from 'hardhat'
import {expect} from 'chai'
import {BondFactory} from '../../typechain'
import {ContractReceipt, ContractTransaction} from 'ethers'

export async function execute(
    transaction: Promise<ContractTransaction>
): Promise<ContractReceipt> {
    return (await transaction).wait(0)
}

export async function deployBondFactory(
    treasury: string
): Promise<BondFactory> {
    const factory = await ethers.getContractFactory('BondFactory')
    const dao = <BondFactory>await factory.deploy(treasury)
    return dao.deployed()
}

export async function signer(index: number): Promise<SignerWithAddress> {
    const signers = await ethers.getSigners()
    expect(signers.length).is.greaterThan(index)
    return signers[index]
}
