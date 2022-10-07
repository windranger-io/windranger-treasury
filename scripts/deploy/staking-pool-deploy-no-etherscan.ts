import {StakingPoolMediator, StakingPoolFactory} from '../../typechain-types'
import {
    awaitContractPropagation,
    deployContract,
    deployContractWithProxy
} from '../utils/contract'

export async function deployStakingPool(
    tokenSweepBeneficiary: string
): Promise<StakingPoolMediator> {
    // deploy factory
    const factory = await deployContract<StakingPoolFactory>(
        'StakingPoolFactory',
        tokenSweepBeneficiary
    )
    await awaitContractPropagation(1500)

    // deploy mediator
    const mediator = await deployContractWithProxy<StakingPoolMediator>(
        'StakingPoolMediator',
        factory.address,
        tokenSweepBeneficiary
    )
    await awaitContractPropagation(1500)

    return mediator
}
