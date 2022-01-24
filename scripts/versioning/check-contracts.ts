import {ERC20Treasury, Version} from '../../typechain'
import {log} from '../../config/logging'
import {deployContract} from '../common'
import {checkContractVersionAgainstReleaseTag} from './check'
import {ethers} from 'hardhat'
const AddressZero = ethers.constants.AddressZero

// could do this with an array of contracts to be deployed?
deployContract<ERC20Treasury>('ERC20Treasury', AddressZero, AddressZero)
    .then((erc20TreasuryContract: Version) => {
        checkContractVersionAgainstReleaseTag(erc20TreasuryContract)
            .then((resolve) => {
                log.info(resolve)
                process.exit(0)
            })
            .catch((error) => {
                log.error(error)
                process.exit(1)
            })
    })
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
