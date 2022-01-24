// this script will be triggered from workflow actions when a new tag is push
import {ethers} from 'hardhat'
import {Contract} from 'ethers'
import {ERC20Treasury} from '../../typechain'
import isSemver from 'is-semver'

import {log} from '../../config/logging'
import {deployContract} from '../common'

const AddressZero = ethers.constants.AddressZero

// for each deployable contract, check that the hardcoded version matches the tag version
async function checkReleaseTag(contractName: string): Promise<boolean> {
    const gitSourceTag = process.env.SOURCE_TAG

    if (gitSourceTag) {
        log.info(`git tag from workflow: ${gitSourceTag}`)
    } else {
        log.info(`git tag from workflow not defined!`)
        process.exit(1)
    }

    const isSemverFlag = isSemver(gitSourceTag)
    log.info("isSemverFlag: ", isSemverFlag)

    if (!isSemver(gitSourceTag)) {
        throw new Error(`Invalid source tag: ${gitSourceTag}`)
    }

    log.info(
        `Checking ${contractName} release against git release tag ${gitSourceTag}`
    )

    // how do we generically deploy contracts, with various constructor params
    const contract: Contract = await deployContract<ERC20Treasury>(
        contractName,
        AddressZero,
        AddressZero
    )
    log.info(`deployed contact at ${contract.address}`)

    const contractVersion: string =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        (await contract.getVersion()) as unknown as string
    log.info(`Contract version: ${contractVersion}`)
    if (gitSourceTag === contractVersion) {
        return true
    }
    throw new Error(
        `Contract version mismatch! ${contractVersion} vs. ${gitSourceTag}`
    )
}

log.info('running checkReleaseTag()')
checkReleaseTag('ERC20Treasury')
    .then((resolve) => {
        log.info(resolve)
        process.exit(0)
    })
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
