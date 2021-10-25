import {expect} from 'chai'
import {ContractTransaction} from 'ethers'

// Transaction status code https://eips.ethereum.org/EIPS/eip-1066
const SUCCESS = 1

export async function transactionSuccess(
    transaction: Promise<ContractTransaction>
): Promise<void> {
    const receipt = await (await transaction).wait()

    expect(receipt).is.not.undefined
    expect(receipt.status).equals(SUCCESS)
}
