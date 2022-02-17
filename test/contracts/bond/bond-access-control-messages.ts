import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'

export function accessControlRevertMessage(
    account: SignerWithAddress,
    role: string
): string {
    return `AccessControl: account ${account.address.toLowerCase()} is missing role ${role}`
}
