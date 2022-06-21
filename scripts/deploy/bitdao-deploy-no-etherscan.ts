import {log} from '../../config/logging'
import {BitDAO} from '../../typechain-types'
import {deployContract} from '../utils/contract'
import {signer} from '../../test/framework/contracts'

async function main() {
    await deployBitDao()
}

export async function deployBitDao(): Promise<void> {
    const deployer = await signer(0)
    await deployContract<BitDAO>('BitDAO', deployer.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
