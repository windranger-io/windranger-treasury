import {ethers, run, upgrades} from 'hardhat'
import {log} from '../../config/logging'
import {TransactionResponse} from '@ethersproject/abstract-provider'

export interface DeployableContract<T> {
    deployed(): Promise<T>
    address: string
    deployTransaction: TransactionResponse
}

export async function deployContract<T extends DeployableContract<T>>(
    name: string,
    ...args: Array<unknown>
): Promise<T> {
    const factory = await ethers.getContractFactory(name)
    const contract = <T>(<unknown>await factory.deploy(...args))

    log.info('%s deployed at: %s', name, contract.address)
    log.info(
        '%s deployment tx: %s',
        contract.address,
        contract.deployTransaction.hash
    )

    return contract.deployed()
}

export async function deployContractWithProxy<T extends DeployableContract<T>>(
    name: string,
    ...args: Array<unknown>
): Promise<T> {
    const factory = await ethers.getContractFactory(name)
    const contract = <T>(
        (<unknown>(
            await upgrades.deployProxy(factory, [...args], {kind: 'uups'})
        ))
    )

    log.info('%s proxy deployed at: %s', name, contract.address)
    log.info(
        '%s deployment tx: %s',
        contract.address,
        contract.deployTransaction.hash
    )

    return contract.deployed()
}

export async function verifyContract<T extends DeployableContract<T>>(
    contract: T,
    ...args: Array<unknown>
): Promise<void> {
    log.info('Verifying contract with Etherscan: %s', contract.address)

    await run('verify:verify', {
        address: contract.address,
        constructorArguments: [...args]
    })
}

export async function awaitContractPropagation(sleepyTimeMs = 15000) {
    log.info('Awaiting contract propagation: %s ms', sleepyTimeMs)

    return new Promise((resolve) => {
        setTimeout(resolve, sleepyTimeMs)
    })
}
