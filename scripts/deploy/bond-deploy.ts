import {
    PerformanceBondMediator,
    PerformanceBondFactory
} from '../../typechain-types'
import {
    awaitContractPropagation,
    deployContract,
    deployContractWithProxy,
    verifyContract
} from '../utils/contract'

export async function deployPerformanceBonds(
    tokenSweepBeneficiary: string
): Promise<void> {
    const factory = await deployContract<PerformanceBondFactory>(
        'PerformanceBondFactory',
        tokenSweepBeneficiary
    )
    const mediator = await deployContractWithProxy<PerformanceBondMediator>(
        'PerformanceBondMediator',
        factory.address,
        tokenSweepBeneficiary
    )

    await awaitContractPropagation()

    await verifyContract<PerformanceBondFactory>(factory, tokenSweepBeneficiary)
    await verifyContract<PerformanceBondMediator>(
        mediator,
        tokenSweepBeneficiary
    )
}
