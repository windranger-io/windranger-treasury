import {run} from 'hardhat'
import {log} from '../../config/logging'
import {deployPerformanceBonds} from './bond-deploy'

async function main() {
    await run('compile')
    await deployPerformanceBonds()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
