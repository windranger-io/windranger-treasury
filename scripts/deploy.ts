import {ethers, run} from 'hardhat'
import {log} from '../config/logging'
import {BitDAO, BondFactory, BondManager, BondMediator} from '../typechain'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'

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

async function awaitContractPropagation() {
    const sleepyTimeMs = 1500
    log.info('Awaiting contract propagation for: %s ms', sleepyTimeMs)

    return new Promise((resolve) => {
        setTimeout(resolve, sleepyTimeMs)
    })
}

async function deployContract<T extends DeployableContract<T>>(
    name: string,
    ...args: Array<unknown>
): Promise<T> {
    const factory = await ethers.getContractFactory(name)
    const contract = <T>(<unknown>await factory.deploy(...args))

    log.info('%s deployed to: %s', name, contract.address)

    return contract.deployed()
}

async function verifyContract<T extends DeployableContract<T>>(
    contract: T,
    ...args: Array<unknown>
): Promise<void> {
    log.info('Verifying contract with Etherscan: %s', contract.address)

    await run('verify:verify', {
        address: contract.address,
        constructorArguments: [...args]
    })
}

interface DeployableContract<T> {
    deployed(): Promise<T>
    address: string
}

async function signer(index: number): Promise<SignerWithAddress> {
    const signers = await ethers.getSigners()

    if (index >= signers.length) {
        throw new Error('Configuration problem: too few signers!')
    }

    return signers[index]
}
