import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ethers, upgrades} from 'hardhat'
import {expect} from 'chai'
import {ContractReceipt, ContractTransaction} from 'ethers'

interface DeployableContract<T> {
    deployed(): Promise<T>
}

/**
 * Deploys a contract, that may or may not have constructor parameters.
 *
 * @param name the case sensitive name of the contract in the Solidity file.
 */
export async function deployContract<T extends DeployableContract<T>>(
    name: string,
    ...args: Array<unknown>
): Promise<T> {
    const factory = await ethers.getContractFactory(name)
    const contract = <T>(<unknown>await factory.deploy(...args))

    return contract.deployed()
}

/**
 * Deploys an admin proxy with the contract as the implementation behind.
 * The contract may or may not have constructor parameters.
 *
 * @param name the case sensitive name of the contract in the Solidity file.
 */
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

    return contract.deployed()
}

/**
 * Upgrades an implementation contract that has a proxy contract in front.
 *
 * @param name the case sensitive name of the contract in the Solidity file.
 * @param upgrading existing address of a proxy with the implementation behind.
 */
export async function upgradeContract<T extends DeployableContract<T>>(
    name: string,
    address: string
): Promise<T> {
    const factory = await ethers.getContractFactory(name)
    const contract = <T>(<unknown>await upgrades.upgradeProxy(address, factory))

    upgrades.admin.changeProxyAdmin

    return contract.deployed()
}

/**
 * Executes the transaction and waits until it has processed before returning.
 */
export async function execute(
    transaction: Promise<ContractTransaction>
): Promise<ContractReceipt> {
    return (await transaction).wait()
}

/**
 * Retrieves the signer found at the given index in the HardHat config,
 * failing when not present.
 */
export async function signer(index: number): Promise<SignerWithAddress> {
    const signers = await ethers.getSigners()
    expect(signers.length).is.greaterThan(index)
    return signers[index]
}
