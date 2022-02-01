import {Box, Version} from '../../typechain'
import {log} from '../../config/logging'
import {deployContract} from '../common'
import {checkContractVersionAgainstReleaseTag} from './check'

deployContract<Box>('Box')
    .then(async (versionedBox: Version) => {
        await checkContractVersionAgainstReleaseTag(versionedBox)
    })
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
