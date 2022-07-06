import {run} from 'hardhat'
import {log} from '../../config/logging'
import {deployBitDao} from './bitdao-deploy-no-etherscan'
import {deployPerformanceBonds} from './bond-deploy-no-etherscan'
import {addressEnvironmentVariable} from '../utils/environment-variable'
import {deployStakingPool} from './staking-pool-deploy-no-etherscan'

async function main() {
    const tokenSweepBeneficiary = addressEnvironmentVariable(
        'TOKEN_SWEEP_BENEFICIARY'
    )
    await run('compile')
    await deployBitDao()
    await deployPerformanceBonds(tokenSweepBeneficiary)
    await deployStakingPool(tokenSweepBeneficiary)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
