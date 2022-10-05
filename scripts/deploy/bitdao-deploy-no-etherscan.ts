import {BitDAO} from '../../typechain-types'
import {deployContract} from '../utils/contract'
import {signer} from '../../test/framework/contracts'

export async function deployBitDao(): Promise<BitDAO> {
    const deployer = await signer(0)
    return deployContract<BitDAO>('BitDAO', deployer.address)
}
