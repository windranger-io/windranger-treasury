import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ethers} from 'hardhat'

export async function signer(index: number): Promise<SignerWithAddress> {
    const signers = await ethers.getSigners()

    if (index >= signers.length) {
        throw new Error('Configuration problem: too few signers!')
    }

    return signers[index]
}
