import {ERC20SingleCollateralBondBox} from '../../../typechain-types'
import {ethers} from 'hardhat'

export async function erc20SingleCollateralBondContractAt(
    address: string
): Promise<ERC20SingleCollateralBondBox> {
    const factory = await ethers.getContractFactory(
        'ERC20SingleCollateralBondBox'
    )
    return <ERC20SingleCollateralBondBox>factory.attach(address)
}
