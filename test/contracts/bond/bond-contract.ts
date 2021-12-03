import {Bond} from '../../../typechain'
import {ethers} from 'hardhat'

export async function bondContractAt(address: string): Promise<Bond> {
    const factory = await ethers.getContractFactory('Bond')
    return <Bond>factory.attach(address)
}
