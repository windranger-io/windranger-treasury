import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ethers} from 'hardhat'
import {expect} from 'chai'
import {BitDAO, Bond, BondFactory} from '../../typechain'
import {ContractReceipt, ContractTransaction} from 'ethers'

export async function connectBond(address: string): Promise<Bond> {
    const factory = await ethers.getContractFactory('Bond')
    return <Bond>factory.attach(address)
}

export async function execute(
    transaction: Promise<ContractTransaction>
): Promise<ContractReceipt> {
    return (await transaction).wait()
}

export async function deployBondFactory(
    securityAsset: string,
    treasury: string
): Promise<BondFactory> {
    const factory = await ethers.getContractFactory('BondFactory')
    const dao = <BondFactory>await factory.deploy(securityAsset, treasury)
    return dao.deployed()
}

export async function deployBitDao(
    creatorAccount: SignerWithAddress
): Promise<BitDAO> {
    const factory = await ethers.getContractFactory('BitDAO')
    const dao = <BitDAO>await factory.deploy(creatorAccount.address)
    return dao.deployed()
}

export async function signer(index: number): Promise<SignerWithAddress> {
    const signers = await ethers.getSigners()
    expect(signers.length).is.greaterThan(index)
    return signers[index]
}
