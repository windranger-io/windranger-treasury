import {BondFactory, BondMediator} from '../../typechain-types'
import {awaitContractPropagation, verifyContract} from '../utils/contract'
import {deployContractWithProxy} from '../../test/framework/contracts'

export async function deployPerformanceBonds(): Promise<void> {
    const factory = await deployContractWithProxy<BondFactory>('BondFactory')
    const mediator = await deployContractWithProxy<BondMediator>(
        'BondMediator',
        factory.address
    )

    await awaitContractPropagation()

    await verifyContract<BondFactory>(factory)
    await verifyContract<BondMediator>(mediator)
}
