import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {Role} from './roles'
import {ethers} from 'ethers'

export function accessControlRevertMessageMissingGlobalRole(
    account: SignerWithAddress,
    role: Role
): string {
    return `RoleMembership: account ${account.address.toLowerCase()} is missing role ${
        role.hex
    }`
}

export function accessControlRevertMessageMissingDaoRole(
    account: SignerWithAddress,
    role: Role,
    daoId: bigint
): string {
    return `RoleMembership: account ${account.address.toLowerCase()} is missing role ${
        role.hex
    } in DAO ${ethers.utils.defaultAbiCoder.encode(['uint256'], [daoId])}`
}

export function accessControlRevertMessageAlreadyGlobalRoleMember(
    account: SignerWithAddress,
    role: Role
): string {
    return `RoleMembership: account ${account.address.toLowerCase()} already has role ${
        role.hex
    }`
}

export function accessControlRevertMessageAlreadyDaoRoleMember(
    account: SignerWithAddress,
    role: Role,
    daoId: bigint
): string {
    return `RoleMembership: account ${account.address.toLowerCase()} already has role ${
        role.hex
    } in DAO ${ethers.utils.defaultAbiCoder.encode(['uint256'], [daoId])}`
}
