import {utils} from 'ethers'

/**
 * Constant Strings of the Roles, padded to the format of Bytes32.
 */
export type Role = {name: string; hex: string}

const SYSTEM_ADMIN: Role = {
    name: 'SYSTEM_ADMIN',
    hex: utils.formatBytes32String('SYSTEM_ADMIN')
}
const BOND_AGGREGATOR: Role = {
    name: 'BOND_AGGREGATOR',
    hex: utils.formatBytes32String('BOND_AGGREGATOR')
}
const BOND_ADMIN: Role = {
    name: 'BOND_ADMIN',
    hex: utils.formatBytes32String('BOND_ADMIN')
}
const DAO_ADMIN: Role = {
    name: 'DAO_ADMIN',
    hex: utils.formatBytes32String('DAO_ADMIN')
}

export {DAO_ADMIN, BOND_ADMIN, BOND_AGGREGATOR, SYSTEM_ADMIN}
