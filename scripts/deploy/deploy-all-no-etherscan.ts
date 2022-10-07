import {log} from '../../config/logging'

import {deployBitDao} from './bitdao-deploy-no-etherscan'
import {deployPerformanceBonds} from './bond-deploy-no-etherscan'
import {deployStakingPool} from './staking-pool-deploy-no-etherscan'

import {setup} from './deploy-all-logic'

const main = setup(
    deployBitDao,
    deployPerformanceBonds,
    deployStakingPool,
    // only wait 1500 ms for timeouts
    1500
)

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
