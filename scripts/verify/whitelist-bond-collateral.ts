import {
    addressEnvironmentVariable,
    bigintEnvironmentVariable
} from '../utils/environment-variable'
import {log} from '../../config/logging'
import {whitelistCollateral} from './whitelist-collateral'

async function main(): Promise<void> {
    const mediator = addressEnvironmentVariable('BOND_MEDIATOR_CONTRACT')
    const collateral = addressEnvironmentVariable('COLLATERAL_TOKENS_CONTRACT')
    const daoId = bigintEnvironmentVariable('DAO_ID')

    return whitelistCollateral(
        mediator,
        daoId,
        collateral,
        'StakingPoolMediator'
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
