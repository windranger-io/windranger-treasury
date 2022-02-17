import {utils} from 'ethers'

/**
 * Constant Strings of the Roles, padded to the format of Bytes32.
 */
const DAO_ADMIN_ROLE = utils.formatBytes32String('DAO_ADMIN')
const BOND_ADMIN_ROLE = utils.formatBytes32String('BOND_ADMIN')
const BOND_AGGREGATOR_ROLE = utils.formatBytes32String('BOND_AGGREGATOR')
const SYSTEM_ADMIN_ROLE = utils.formatBytes32String('SYSTEM_ADMIN')

export {
    DAO_ADMIN_ROLE,
    BOND_ADMIN_ROLE,
    BOND_AGGREGATOR_ROLE,
    SYSTEM_ADMIN_ROLE
}
