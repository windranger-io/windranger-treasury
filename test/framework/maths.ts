import {BigNumber, BigNumberish} from 'ethers'

export function divideBigNumberish(
    dividend: BigNumberish,
    divisor: bigint
): bigint {
    return BigNumber.from(dividend).toBigInt() / divisor
}
