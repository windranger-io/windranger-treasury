import {BondFactory, BondMediator} from '../../typechain-types'
import {
    awaitContractPropagation,
    deployContract,
    deployContractWithProxy,
    verifyContract
} from '../utils/contract'

export async function deployPerformanceBonds(
    tokenSweepBeneficiary: string
): Promise<void> {
    const factory = await deployContract<BondFactory>(
        'BondFactory',
        tokenSweepBeneficiary
    )
    const mediator = await deployContractWithProxy<BondMediator>(
        'BondMediator',
        factory.address,
        tokenSweepBeneficiary
    )

    await awaitContractPropagation()

    await verifyContract<BondFactory>(factory)
    await verifyContract<BondMediator>(mediator)
}
