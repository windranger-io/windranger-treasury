import {BitDAO} from '../../typechain-types'
import {deployContract} from '../utils/contract'
import {signer} from '../../test/framework/contracts'

export async function deployBitDao(): Promise<void> {
    const deployer = await signer(0)
    await deployContract<BitDAO>('BitDAO', deployer.address)
}
