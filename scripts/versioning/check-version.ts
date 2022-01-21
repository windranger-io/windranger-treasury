import {ethers, run} from 'hardhat'
import {Contract} from 'ethers'
import {ERC20Treasury} from '../../typechain'
import {log} from '../../config/logging'

const AddressZero = ethers.constants.AddressZero
// this script will be triggered from workflow actions when a new tag is push

// for each deployable contract, check that the hardcoded version matches the tag version

async function checkReleaseTag(
    gitReleaseTag: string,
    contractName: string
): Promise<boolean> {
    await run('compile')

    log.info(
        `Checking ${contractName} release against git release tag ${gitReleaseTag}`
    )

    // how do we generically deploy contracts?
    const contract: Contract = await deployContract<ERC20Treasury>(
        contractName,
        AddressZero,
        AddressZero
    )
    log.info(`deployed contact at ${contract.address}`)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const contractVersion: unknown = await contract.getVersion()
    log.info(`Contract version: ${contractVersion as string}`)
    if (gitReleaseTag === contractVersion) {
        return true
    }
    return false
}

log.info('running checkReleaseTag()')
checkReleaseTag('v0.0.1', 'ERC20Treasury')
    .then((resolve) => {
        log.info(resolve)
        log.info('success')
        process.exit(0)
    })
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })

// common with scripts/bond/deploy.ts --refactor?
async function deployContract<T extends DeployableContract<T>>(
    name: string,
    ...args: Array<unknown>
): Promise<T> {
    const factory = await ethers.getContractFactory(name)
    const contract = <T>(<unknown>await factory.deploy(...args))

    log.info('%s deployed to: %s', name, contract.address)

    return contract.deployed()
}

interface DeployableContract<T> {
    deployed(): Promise<T>
    address: string
}
