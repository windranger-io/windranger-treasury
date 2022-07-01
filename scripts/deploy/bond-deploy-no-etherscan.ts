import {
    PerformanceBondFactory,
    PerformanceBondMediator
} from '../../typechain-types'
import {
    awaitContractPropagation,
    deployContract,
    deployContractWithProxy
} from '../utils/contract'

export async function deployPerformanceBonds(
    tokenSweepBeneficiary: string
): Promise<void> {
    const factory = await deployContract<PerformanceBondFactory>(
        'PerformanceBondFactory',
        tokenSweepBeneficiary
    )
    await awaitContractPropagation()

    await deployContractWithProxy<PerformanceBondMediator>(
        'PerformanceBondMediator',
        factory.address,
        tokenSweepBeneficiary
    )
    await awaitContractPropagation()
}
