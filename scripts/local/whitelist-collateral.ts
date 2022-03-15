import {ethers} from 'hardhat'
import {BondMediator} from '../../typechain-types'
import {log} from '../../config/logging'
import {ContractReceipt, Event} from 'ethers'
import {
    addressEnvironmentVariable,
    bigintEnvironmentVariable
} from '../utils/environment-variable'

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

    log.info('Transaction: ', receipt.transactionHash)

    const events = receiptEvents(receipt)

    for (const event of events) {
        log.info('%s, %s', event.event, JSON.stringify(event.args))
    }
}

async function main(): Promise<void> {
    const mediator = addressEnvironmentVariable('BOND_MEDIATOR_CONTRACT')
    const collateral = addressEnvironmentVariable('COLLATERAL_TOKENS_CONTRACT')
    const daoId = bigintEnvironmentVariable('DAO_ID')

    return whitelistCollateral(mediator, daoId, collateral)
}

function receiptEvents(receipt: ContractReceipt): Event[] {
    const availableEvents = receipt.events
    return availableEvents ? availableEvents : []
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
