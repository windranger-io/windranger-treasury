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
): Promise<PerformanceBondMediator> {
    const factory = await deployContract<PerformanceBondFactory>(
        'PerformanceBondFactory',
        tokenSweepBeneficiary
    )
    await awaitContractPropagation()

    return deployContractWithProxy<PerformanceBondMediator>(
        'PerformanceBondMediator',
        factory.address,
        tokenSweepBeneficiary
    )
}
