import {addressEnvironmentVariable} from '../utils/environment-variable'
import {log} from '../../config/logging'
import {createDao} from './create-dao'

async function main(): Promise<void> {
    const mediator = addressEnvironmentVariable('BOND_MEDIATOR_CONTRACT')
    const treasury = addressEnvironmentVariable('TREASURY_ADDRESS')

    return createDao(mediator, treasury, 'PerformanceBondMediator')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
