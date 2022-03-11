import {utils} from 'ethers'

/**
 * Constant Strings of the Roles, padded to the format of Bytes32.
 */
export type Role = {name: string; hex: string}

const SUPER_USER: Role = {
    name: 'SUPER_USER',
    hex: utils.formatBytes32String('SUPER_USER')
}
const SYSTEM_ADMIN: Role = {
    name: 'SYSTEM_ADMIN',
    hex: utils.formatBytes32String('SYSTEM_ADMIN')
}
const DAO_ADMIN: Role = {
    name: 'DAO_ADMIN',
    hex: utils.formatBytes32String('DAO_ADMIN')
}
const DAO_CREATOR: Role = {
    name: 'DAO_CREATOR',
    hex: utils.formatBytes32String('DAO_CREATOR')
}
const DAO_MEEPLE: Role = {
    name: 'DAO_MEEPLE',
    hex: utils.formatBytes32String('DAO_MEEPLE')
}

export {SUPER_USER, SYSTEM_ADMIN, DAO_ADMIN, DAO_CREATOR, DAO_MEEPLE}
