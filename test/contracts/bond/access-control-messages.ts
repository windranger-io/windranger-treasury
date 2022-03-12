import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {Role} from './roles'

export function accessControlRevertMessageMissingRole(
    account: SignerWithAddress,
    role: Role
): string {
    return `RoleMembership: account ${account.address.toLowerCase()} is missing role ${
        role.hex
    }`
}

export function accessControlRevertMessageAlreadyRoleMember(
    account: SignerWithAddress,
    role: Role
): string {
    return `RoleMembership: account ${account.address.toLowerCase()} already has role ${
        role.hex
    }`
}
