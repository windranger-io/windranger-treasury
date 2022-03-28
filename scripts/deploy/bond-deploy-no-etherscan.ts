import {BondFactory, BondMediator} from '../../typechain-types'
import {deployContractWithProxy} from '../../test/framework/contracts'

export async function deployPerformanceBonds(): Promise<void> {
    const factory = await deployContractWithProxy<BondFactory>('BondFactory')
    await deployContractWithProxy<BondMediator>('BondMediator', factory.address)
}
