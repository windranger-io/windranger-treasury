import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {Role} from './roles'

export function accessControlRevertMessage(
    account: SignerWithAddress,
    role: Role
): string {
    return `AccessControl: account ${account.address.toLowerCase()} is missing role ${
        role.hex
    }`
}
