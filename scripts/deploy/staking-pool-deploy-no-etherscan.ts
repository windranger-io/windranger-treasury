import {StakingPoolMediator, StakingPoolFactory} from '../../typechain-types'
import {deployContract, deployContractWithProxy} from '../utils/contract'

export async function deployStakingPool(
    tokenSweepBeneficiary: string
): Promise<void> {
    const factory = await deployContract<StakingPoolFactory>(
        'StakingPoolFactory',
        tokenSweepBeneficiary
    )
    await deployContractWithProxy<StakingPoolMediator>(
        'StakingPoolMediator',
        factory.address,
        tokenSweepBeneficiary
    )
}
