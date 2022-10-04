import {
    addressEnvironmentVariable,
    stringEnvironmentVariable
} from '../utils/environment-variable'
import {log} from '../../config/logging'
import {createDao} from './create-dao'

async function main(): Promise<void> {
    const mediator = addressEnvironmentVariable('STAKING_POOL_MEDIATOR_ADDRESS')
    const treasury = addressEnvironmentVariable('TREASURY_ADDRESS')
    const metadata = stringEnvironmentVariable('DAO_METADATA')

    return createDao(mediator, treasury, 'StakingPoolMediator', metadata)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
