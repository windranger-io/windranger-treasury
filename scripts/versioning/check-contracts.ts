import {Box} from '../../typechain-types'
import {log} from '../../config/logging'
import {deployContract} from '../common'
import {checkContractVersionAgainstReleaseTag} from './check'
import {Version} from '../../test/contracts/cast/version'

deployContract<Box>('Box')
    .then(async (versionedBox: Version) => {
        await checkContractVersionAgainstReleaseTag(versionedBox)
    })
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
