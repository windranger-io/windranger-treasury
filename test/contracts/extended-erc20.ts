import {
    BaseContract,
    BigNumber,
    BigNumberish,
    CallOverrides,
    ContractTransaction,
    Overrides,
    Signer
} from 'ethers'
import {Provider} from '@ethersproject/providers'

/**
 * Partial duplication of the TypeChain generated file, to enable casting of contract that inherit from ERC20.
 * (This broken during the TypeChain 7.x & associated HardHat upgrades)
 */
export interface ExtendedERC20 extends BaseContract {
    connect(signerOrProvider: Signer | Provider | string): this
    attach(addressOrName: string): this
    deployed(): Promise<this>

    allowance(
        owner: string,
        spender: string,
        overrides?: CallOverrides
    ): Promise<BigNumber>

    approve(
        spender: string,
        amount: BigNumberish,
        overrides?: Overrides & {from?: string | Promise<string>}
    ): Promise<ContractTransaction>

    balanceOf(account: string, overrides?: CallOverrides): Promise<BigNumber>

    decimals(overrides?: CallOverrides): Promise<number>

    decreaseAllowance(
        spender: string,
        subtractedValue: BigNumberish,
        overrides?: Overrides & {from?: string | Promise<string>}
    ): Promise<ContractTransaction>

    increaseAllowance(
        spender: string,
        addedValue: BigNumberish,
        overrides?: Overrides & {from?: string | Promise<string>}
    ): Promise<ContractTransaction>

    name(overrides?: CallOverrides): Promise<string>

    symbol(overrides?: CallOverrides): Promise<string>

    totalSupply(overrides?: CallOverrides): Promise<BigNumber>

    transfer(
        recipient: string,
        amount: BigNumberish,
        overrides?: Overrides & {from?: string | Promise<string>}
    ): Promise<ContractTransaction>

    transferFrom(
        sender: string,
        recipient: string,
        amount: BigNumberish,
        overrides?: Overrides & {from?: string | Promise<string>}
    ): Promise<ContractTransaction>
}
