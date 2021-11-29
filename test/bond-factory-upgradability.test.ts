// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
import '@openzeppelin/hardhat-upgrades'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BitDAO, BondFactory, Box, ERC20} from '../typechain'
import {deployContract, execute, signer} from './framework/contracts'
import {constants} from 'ethers'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {verifyCreateBondEvent} from './contracts/bond/verify-bond-factory-events'
import {ethers, upgrades} from 'hardhat'

// Wires up Waffle with Chai
chai.use(solidity)

describe('BondFactory contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        collateralSymbol = await collateralTokens.symbol()

        //TODO abstract - deployed proxy, pass in upgrades
        const factory = await ethers.getContractFactory('BondFactory')
        bonds = <BondFactory>(
            await upgrades.deployProxy(
                factory,
                [collateralTokens.address, treasury],
                {kind: 'uups'}
            )
        )

        // bonds = await deployContract<BondFactory>(
        //     'BondFactory',
        //     collateralTokens.address,
        //     treasury
    })

    /*
    state-variable-assignment
    state-variable-immutable
    external-library-linking
    struct-definition
    enum-definition
    constructor
    delegatecall
    selfdestruct
    missing-public-upgradeto
*/

    //TODO events emitted for upgraded & admin changed
    // Upgraded(implementation)
    //
    // AdminChanged(previousAdmin, newAdmin)
    //
    // BeaconUpgraded(beacon)

    describe('Upgrade', () => {
        //TODO test - happy path, upgrade
        //TODO test - invalid upgrade, no public upgradeTo
        //TODO test - invalid upgrade, no init
        //TODO transfer proxy admin ownership
        //TODO test only owner upgradable

        it('carries storage across', async () => {
            const startingProxyAddress = bonds.address
            const startingTreasury = await bonds.treasury()
            expect(startingTreasury).equals(treasury)

            const factory = await ethers.getContractFactory('BondFactory')
            const upgrade = <BondFactory>(
                await upgrades.upgradeProxy(bonds.address, factory)
            )

            expect(startingProxyAddress).equals(upgrade.address)
            expect(await upgrade.treasury()).equals(treasury)
        })
    })

    let admin: string
    let treasury: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ERC20
    let collateralSymbol: string
    let bonds: BondFactory
})
