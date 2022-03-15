import {run} from 'hardhat'
import {log} from '../../config/logging'
import {BitDAO, BondFactory, BondMediator} from '../../typechain-types'
import {signer} from '../utils/signer'
import {
    awaitContractPropagation,
    deployContract,
    verifyContract
} from '../utils/contract'

async function main() {
    await run('compile')

    const deployer = await signer(0)
    const tokens = await deployContract<BitDAO>('BitDAO', deployer.address)

    const factory = await deployContract<BondFactory>('BondFactory')
    await factory.initialize()
    const mediator = await deployContract<BondMediator>('BondMediator')
    await mediator.initialize(factory.address)

    await awaitContractPropagation()

    await verifyContract<BitDAO>(tokens, deployer.address)
    await verifyContract<BondFactory>(factory)
    await verifyContract<BondMediator>(mediator)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
