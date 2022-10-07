/* eslint-disable no-console */
import {ethers, upgrades} from 'hardhat'
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
): Promise<PerformanceBondMediator> {
    // deploy factory
    const factory = await deployContract<PerformanceBondFactory>(
        'PerformanceBondFactory',
        tokenSweepBeneficiary
    )
    await awaitContractPropagation()

    // deploy mediator
    const mediator = await deployContractWithProxy<PerformanceBondMediator>(
        'PerformanceBondMediator',
        factory.address,
        tokenSweepBeneficiary
    )
    await awaitContractPropagation()

    // verify factory
    try {
        await verifyContract<PerformanceBondFactory>(
            factory,
            tokenSweepBeneficiary
        )
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Verfication failed: ${e}`)
    }

    // verify mediator Proxy
    try {
        const mediatorFactory = await ethers.getContractFactory(
            'PerformanceBondMediator'
        )
        const implementationAddress =
            await upgrades.erc1967.getImplementationAddress(mediator.address)

        await verifyContract<PerformanceBondMediator>(
            mediatorFactory.attach(
                implementationAddress
            ) as PerformanceBondMediator
        )
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Verfication failed: ${e}`)
    }

    return mediator
}
