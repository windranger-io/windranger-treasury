import {run} from 'hardhat'
import {log} from '../../config/logging'
import {deployPerformanceBonds} from './bond-deploy'
import {addressEnvironmentVariable} from '../utils/environment-variable'
import {deployStakingPool} from './staking-pool-deploy'

async function main() {
    const tokenSweepBeneficiary = addressEnvironmentVariable(
        'TOKEN_SWEEP_BENEFICIARY'
    )

    await run('compile')

    // await deployPerformanceBonds(tokenSweepBeneficiary)
    await deployStakingPool(tokenSweepBeneficiary)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
