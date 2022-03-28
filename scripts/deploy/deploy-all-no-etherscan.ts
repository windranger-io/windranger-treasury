import {run} from 'hardhat'
import {log} from '../../config/logging'
import {deployBitDao} from './bitdao-deploy-no-etherscan'
import {deployPerformanceBonds} from './bond-deploy-no-etherscan'

async function main() {
    await run('compile')
    await deployBitDao()
    await deployPerformanceBonds()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
