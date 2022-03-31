import {BondFactory, BondMediator} from '../../typechain-types'
import {deployContract, deployContractWithProxy} from '../utils/contract'

export async function deployPerformanceBonds(
    tokenSweepBeneficiary: string
): Promise<void> {
    const factory = await deployContract<BondFactory>(
        'BondFactory',
        tokenSweepBeneficiary
    )
    await deployContractWithProxy<BondMediator>(
        'BondMediator',
        factory.address,
        tokenSweepBeneficiary
    )
}
