import {ethers} from 'hardhat'
import {BondMediator} from '../../typechain-types'
import {log} from '../../config/logging'
import {
    addressEnvironmentVariable,
    bigintEnvironmentVariable
} from '../utils/environment-variable'
import {logEvents} from '../utils/transaction-event-log'

async function whitelistCollateral(
    mediatorAddress: string,
    daoId: bigint,
    collateralTokens: string
) {
    const factory = await ethers.getContractFactory('BondMediator')
    const contract = <BondMediator>factory.attach(mediatorAddress)

    log.info('Whitelisting ERC20 token collateral')

    const transaction = await contract.whitelistCollateral(
        daoId,
        collateralTokens
    )

    const receipt = await transaction.wait()

    log.info('Transaction complete with status %s', receipt.status)

    logEvents(receipt)
}

async function main(): Promise<void> {
    const mediator = addressEnvironmentVariable('BOND_MEDIATOR_CONTRACT')
    const collateral = addressEnvironmentVariable('COLLATERAL_TOKENS_CONTRACT')
    const daoId = bigintEnvironmentVariable('DAO_ID')

    return whitelistCollateral(mediator, daoId, collateral)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
