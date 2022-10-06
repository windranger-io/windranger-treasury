import {log} from '../../config/logging'

import {deployBitDao} from './bitdao-deploy'
import {deployPerformanceBonds} from './bond-deploy'
import {deployStakingPool} from './staking-pool-deploy'

import {setup} from './deploy-all-logic'

const main = setup(deployBitDao, deployPerformanceBonds, deployStakingPool)

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
