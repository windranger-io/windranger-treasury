/* eslint-disable no-console */
import {ethers, upgrades} from 'hardhat'
import {StakingPoolMediator, StakingPoolFactory} from '../../typechain-types'
import {
    awaitContractPropagation,
    deployContract,
    deployContractWithProxy,
    verifyContract
} from '../utils/contract'

export async function deployStakingPool(
    tokenSweepBeneficiary: string
): Promise<StakingPoolMediator> {
    // deploy factory
    const factory = await deployContract<StakingPoolFactory>(
        'StakingPoolFactory',
        tokenSweepBeneficiary
    )
    await awaitContractPropagation()

    // deploy mediator
    const mediator = await deployContractWithProxy<StakingPoolMediator>(
        'StakingPoolMediator',
        factory.address,
        tokenSweepBeneficiary
    )
    await awaitContractPropagation()

    // verify factory
    try {
        await verifyContract<StakingPoolFactory>(factory, tokenSweepBeneficiary)
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Verfication failed: ${e}`)
    }

    // verify mediator Proxy
    try {
        const mediatorFactory = await ethers.getContractFactory(
            'StakingPoolMediator'
        )
        const implementationAddress =
            await upgrades.erc1967.getImplementationAddress(mediator.address)

        await verifyContract<StakingPoolMediator>(
            mediatorFactory.attach(implementationAddress) as StakingPoolMediator
        )
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Verfication failed: ${e}`)
    }

    return mediator
}
