import {StakingPoolMediator, StakingPoolFactory} from '../../typechain-types'
import {
    awaitContractPropagation,
    deployContract,
    deployContractWithProxy,
    verifyContract
} from '../utils/contract'

export async function deployStakingPool(
    tokenSweepBeneficiary: string
): Promise<StakingPoolMediator> {
    const factory = await deployContract<StakingPoolFactory>(
        'StakingPoolFactory',
        tokenSweepBeneficiary
    )
    const mediator = await deployContractWithProxy<StakingPoolMediator>(
        'StakingPoolMediator',
        factory.address,
        tokenSweepBeneficiary
    )

    await awaitContractPropagation()

    await verifyContract<StakingPoolFactory>(factory, tokenSweepBeneficiary)
    await verifyContract<StakingPoolMediator>(mediator, tokenSweepBeneficiary)

    return mediator
}
