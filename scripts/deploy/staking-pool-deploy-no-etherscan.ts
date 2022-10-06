import {StakingPoolMediator, StakingPoolFactory} from '../../typechain-types'
import {
    awaitContractPropagation,
    deployContract,
    deployContractWithProxy
} from '../utils/contract'

export async function deployStakingPool(
    tokenSweepBeneficiary: string
): Promise<StakingPoolMediator> {
    const factory = await deployContract<StakingPoolFactory>(
        'StakingPoolFactory',
        tokenSweepBeneficiary
    )
    await awaitContractPropagation()

    const mediator = await deployContractWithProxy<StakingPoolMediator>(
        'StakingPoolMediator',
        factory.address,
        tokenSweepBeneficiary
    )
    await awaitContractPropagation()

    return mediator
}
