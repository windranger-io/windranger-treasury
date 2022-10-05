import {StakingPoolMediator, StakingPoolFactory} from '../../typechain-types'
import {deployContract, deployContractWithProxy} from '../utils/contract'

export async function deployStakingPool(
    tokenSweepBeneficiary: string
): Promise<StakingPoolMediator> {
    const factory = await deployContract<StakingPoolFactory>(
        'StakingPoolFactory',
        tokenSweepBeneficiary
    )

    return deployContractWithProxy<StakingPoolMediator>(
        'StakingPoolMediator',
        factory.address,
        tokenSweepBeneficiary
    )
}
