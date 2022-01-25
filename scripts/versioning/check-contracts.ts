import {ERC20Treasury, Version} from '../../typechain'
import {log} from '../../config/logging'
import {deployContract} from '../common'
import {checkContractVersionAgainstReleaseTag} from './check'
import {ethers} from 'hardhat'
const AddressZero = ethers.constants.AddressZero

// could do this with an array of contracts to be deployed?
deployContract<ERC20Treasury>('ERC20Treasury', AddressZero, AddressZero)
    .then(async (erc20TreasuryContract: Version) => {
        await checkContractVersionAgainstReleaseTag(erc20TreasuryContract)
    })
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
