import {ethers} from 'hardhat'
import {
    PerformanceBondMediator,
    StakingPoolMediator
} from '../../typechain-types'
import {log} from '../../config/logging'
import {logEvents} from '../utils/transaction-event-log'

export async function whitelistCollateral(
    mediatorAddress: string,
    daoId: bigint,
    collateralTokens: string,
    mediatorType: string
) {
    const factory = await ethers.getContractFactory(mediatorType)
    const contract = <StakingPoolMediator | PerformanceBondMediator>(
        factory.attach(mediatorAddress)
    )

    log.info('Whitelisting ERC20 token collateral')

    const transaction = await contract.whitelistCollateral(
        daoId,
        collateralTokens
    )

    const receipt = await transaction.wait()

    log.info('Transaction complete with status %s', receipt.status)

    logEvents(receipt)
}
