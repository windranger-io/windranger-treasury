// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {Box} from '../typechain-types'
import {deployContractWithProxy, upgradeContract} from './framework/contracts'

// Wires up Waffle with Chai
chai.use(solidity)
describe('Versioned Box contract', () => {
    let box: Box

    before(async () => {
        box = await deployContractWithProxy<Box>('Box')
    })

    describe('proxy upgrade', () => {
        it('maintains version across upgrade', async () => {
            const MOCK_TAG = 'mock_tag'
            const LONG_TAG =
                'blahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahb'
            const originalVersion: string = await box.VERSION()
            expect(originalVersion).to.not.equal(MOCK_TAG)
            // upgrading to the same implementation
            await upgradeContract('Box', box.address)
            const upgradedVersion = await box.VERSION()
            expect(originalVersion).to.equal(upgradedVersion)
            // pointing the proxy to the upgraded contract -- the version tag here is mock_tag
            await upgradeContract('BoxExtension', box.address)
            expect(await box.VERSION()).to.equal(MOCK_TAG)
            await upgradeContract(
                'BoxExtensionWithVeryLongVersionTag',
                box.address
            )
            expect(await box.VERSION()).to.equal(LONG_TAG)
        })
    })
})
