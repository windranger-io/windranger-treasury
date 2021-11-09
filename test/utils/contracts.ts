import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ethers} from 'hardhat'
import {expect} from 'chai'
import {Bond} from '../../typechain'
import {ContractReceipt, ContractTransaction} from 'ethers'

//TODO move & genericise the factory interaction
export async function bondContractAt(address: string): Promise<Bond> {
    const factory = await ethers.getContractFactory('Bond')
    return <Bond>factory.attach(address)
}

interface DeployableContract<T> {
    deployed(): Promise<T>
}

export async function deployContract<T extends DeployableContract<T>>(
    name: string,
    ...args: Array<unknown>
): Promise<T> {
    const factory = await ethers.getContractFactory(name)
    const dao = <T>(<unknown>await factory.deploy(...args))

    return dao.deployed()
}

export async function execute(
    transaction: Promise<ContractTransaction>
): Promise<ContractReceipt> {
    return (await transaction).wait()
}

export async function signer(index: number): Promise<SignerWithAddress> {
    const signers = await ethers.getSigners()
    expect(signers.length).is.greaterThan(index)
    return signers[index]
}
