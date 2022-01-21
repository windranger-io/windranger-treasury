import {run} from 'hardhat'
import {log} from '../../config/logging'
import {BitDAO, BondFactory, BondManager, BondMediator} from '../../typechain'
import {deployContract, signer, awaitContractPropagation, verifyContract} from '../common'


async function main() {
    await run('compile')

    const deployer = await signer(0)
    const treasury = deployer
    const tokens = await deployContract<BitDAO>('BitDAO', deployer.address)

    const factory = await deployContract<BondFactory>('BondFactory')
    await factory.initialize(tokens.address, treasury.address)
    const manager = await deployContract<BondManager>('BondManager')
    await manager.initialize()
    const mediator = await deployContract<BondMediator>('BondMediator')
    await mediator.initialize(factory.address, manager.address)

    await awaitContractPropagation()

    await verifyContract<BitDAO>(tokens, deployer.address)
    await verifyContract<BondFactory>(factory)
    await verifyContract<BondManager>(manager)
    await verifyContract<BondMediator>(mediator)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
