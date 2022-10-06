import {BitDAO} from '../../typechain-types'
import {awaitContractPropagation, deployContract} from '../utils/contract'
import {signer} from '../../test/framework/contracts'

export async function deployBitDao(): Promise<BitDAO> {
    const deployer = await signer(0)
    const bitDAO = await deployContract<BitDAO>('BitDAO', deployer.address)

    await awaitContractPropagation()

    return bitDAO
}
