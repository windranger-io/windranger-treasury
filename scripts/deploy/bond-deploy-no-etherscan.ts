import {
    PerformanceBondFactory,
    PerformanceBondMediator
} from '../../typechain-types'
import {deployContract, deployContractWithProxy} from '../utils/contract'

export async function deployPerformanceBonds(
    tokenSweepBeneficiary: string
): Promise<void> {
    const factory = await deployContract<PerformanceBondFactory>(
        'BondFactory',
        tokenSweepBeneficiary
    )
    await deployContractWithProxy<PerformanceBondMediator>(
        'BondMediator',
        factory.address,
        tokenSweepBeneficiary
    )
}
