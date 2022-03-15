import {
    Box,
    BondFactory,
    BondMediator,
    ERC20SingleCollateralBond
} from '../../typechain-types'
import {log} from '../../config/logging'
import {checkContractVersionAgainstReleaseTag} from './check'
import {Version} from '../../test/contracts/cast/version'
import {deployContract} from '../utils/contract'

function deployAndCheckVersion<T extends Version>(contractName: string) {
    deployContract<T>(contractName)
        .then(async (versionedContract: Version) => {
            await checkContractVersionAgainstReleaseTag(versionedContract)
        })
        .catch((error) => {
            log.error(error)
            process.exit(1)
        })
}

deployAndCheckVersion<Box>('Box')
deployAndCheckVersion<BondFactory>('BondFactory')
deployAndCheckVersion<BondMediator>('BondMediator')
deployAndCheckVersion<ERC20SingleCollateralBond>('ERC20SingleCollateralBond')
