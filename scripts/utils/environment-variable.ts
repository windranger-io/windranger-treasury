import {ethers} from 'hardhat'
import {log} from '../../config/logging'

export function bigintEnvironmentVariable(name: string): bigint {
    return BigInt(parseEnvironmentVariable(name))
}

export function addressEnvironmentVariable(name: string): string {
    const address = parseEnvironmentVariable(name)

    if (!ethers.utils.isAddress(address)) {
        throw Error(`Environment variable ${name} is not an Ethereum address`)
    }

    return address
}

function parseEnvironmentVariable(name: string): string {
    const envVar = process.env[name]

    // eslint-disable-next-line no-undefined
    if (envVar === undefined) {
        throw Error(`Missing environment variable: ${name}`)
    }

    return envVar
}
