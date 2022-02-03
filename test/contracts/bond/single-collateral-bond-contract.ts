import {ERC20SingleCollateralBond} from '../../../typechain-types'
import {ethers} from 'hardhat'

export async function erc20SingleCollateralBondContractAt(
    address: string
): Promise<ERC20SingleCollateralBond> {
    const factory = await ethers.getContractFactory('ERC20SingleCollateralBond')
    return <ERC20SingleCollateralBond>factory.attach(address)
}
