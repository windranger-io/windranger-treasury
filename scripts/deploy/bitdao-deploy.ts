import {BitDAO} from '../../typechain-types'
import {
    awaitContractPropagation,
    deployContract,
    verifyContract
} from '../utils/contract'
import {signer} from '../../test/framework/contracts'

export async function deployBitDao(): Promise<BitDAO> {
    const deployer = await signer(0)

    // deploy bitdao token
    const bitDAO = await deployContract<BitDAO>('BitDAO', deployer.address)
    await awaitContractPropagation()

    // verify bitdao token
    try {
        await verifyContract<BitDAO>(bitDAO, deployer.address)
    } catch (e) {
        // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
        console.log(`Verfication failed: ${e}`)
    }

    return bitDAO
}
