// this script will be triggered from workflow actions when a new tag is push
import {log} from '../../config/logging'
import {Version} from '../../test/cast/version'

/*
 * takes a contract that inherits Version and returns true if the contract's version is equal to the release tag
 * throws otherwise
 *
 * @param A Contract object that inherits Version
 *
 */
export async function checkContractVersionAgainstReleaseTag(
    contract: Version
): Promise<boolean> {
    const gitSourceTag = process.env.SOURCE_TAG

    if (gitSourceTag) {
        log.info(`git tag: ${gitSourceTag}`)
    } else {
        log.info(`git tag not defined!`)
        process.exit(1)
    }
    const contractVersion = await contract.VERSION()
    log.info(`Contract version: ${contractVersion}`)
    if (gitSourceTag === contractVersion) {
        return true
    }
    throw new Error(
        `Contract ${contract.address} has version mismatch! Bytecode:${contractVersion} vs. Git tag: ${gitSourceTag}`
    )
}
