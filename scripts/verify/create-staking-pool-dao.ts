import {addressEnvironmentVariable} from '../utils/environment-variable'
import {log} from '../../config/logging'
import {createDao} from './create-dao'

async function main(): Promise<void> {
    const mediator = addressEnvironmentVariable('STAKING_POOL_MEDIATOR_ADDRESS')
    const treasury = addressEnvironmentVariable('TREASURY_ADDRESS')

    return createDao(mediator, treasury, 'StakingPoolMediator')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
