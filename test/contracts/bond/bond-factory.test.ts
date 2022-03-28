// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {BitDAO, BondFactory} from '../../../typechain-types'
import {
    deployContract,
    deployContractWithProxy,
    execute,
    signer
} from '../../framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {verifyCreateBondEvent} from '../../event/bond/verify-bond-creator-events'
import {ExtendedERC20} from '../../cast/extended-erc20'
import {SYSTEM_ADMIN} from '../../event/bond/roles'
import {successfulTransaction} from '../../framework/transaction'
import {accessControlRevertMessageMissingGlobalRole} from '../../event/bond/access-control-messages'

// Wires up Waffle with Chai
chai.use(solidity)

describe('Bond Factory contract', () => {
    before(async () => {
        admin = (await signer(0)).address
        treasury = (await signer(1)).address
        nonAdmin = await signer(2)
        collateralTokens = await deployContract<BitDAO>('BitDAO', admin)
        bonds = await deployContractWithProxy<BondFactory>('BondFactory')
    })

    describe('create bond', () => {
        after(async () => {
            if (await bonds.paused()) {
                await bonds.unpause()
            }
        })
        it('with BIT token collateral', async () => {
            const bondName = 'Special Debt Certificate'
            const bondSymbol = 'SDC001'
            const debtTokenAmount = 555666777n
            const expiryTimestamp = 560000n
            const minimumDeposit = 100n
            const data = 'a random;delimiter;separated string'

            const receipt = await execute(
                bonds.createBond(
                    {name: bondName, symbol: bondSymbol, data: data},
                    {
                        debtTokenAmount: debtTokenAmount,
                        collateralTokens: collateralTokens.address,
                        expiryTimestamp: expiryTimestamp,
                        minimumDeposit: minimumDeposit
                    },
                    [],
                    treasury
                )
            )

            await verifyCreateBondEvent(
                {
                    creator: admin,
                    metadata: {name: bondName, symbol: bondSymbol, data: data},
                    configuration: {
                        debtTokenAmount: debtTokenAmount,
                        collateralTokens: collateralTokens.address,
                        expiryTimestamp: expiryTimestamp,
                        minimumDeposit: minimumDeposit
                    },
                    rewards: [],
                    treasury: treasury
                },
                receipt
            )
        })
        it('only when not paused', async () => {
            await successfulTransaction(bonds.pause())
            expect(await bonds.paused()).is.true

            await expect(
                bonds.createBond(
                    {name: 'Named bond', symbol: 'AA00AA', data: ''},
                    {
                        debtTokenAmount: 101n,
                        collateralTokens: collateralTokens.address,
                        expiryTimestamp: 0n,
                        minimumDeposit: 0n
                    },
                    [],
                    treasury
                )
            ).to.be.revertedWith('Pausable: paused')
        })
    })

    describe('pause', () => {
        after(async () => {
            if (await bonds.paused()) {
                await bonds.unpause()
            }
        })

        it('at least system admin', async () => {
            await expect(bonds.connect(nonAdmin).pause()).to.be.revertedWith(
                accessControlRevertMessageMissingGlobalRole(
                    nonAdmin,
                    SYSTEM_ADMIN
                )
            )
        })

        it('changes state', async () => {
            expect(await bonds.paused()).is.false

            await bonds.pause()

            expect(await bonds.paused()).is.true
        })

        it('only when not paused', async () => {
            await expect(bonds.pause()).to.be.revertedWith('Pausable: paused')
        })
    })

    describe('unpause', () => {
        before(async () => {
            if (!(await bonds.paused())) {
                await bonds.pause()
            }
        })
        after(async () => {
            if (await bonds.paused()) {
                await bonds.unpause()
            }
        })

        it('at least system admin', async () => {
            await expect(bonds.connect(nonAdmin).unpause()).to.be.revertedWith(
                accessControlRevertMessageMissingGlobalRole(
                    nonAdmin,
                    SYSTEM_ADMIN
                )
            )
        })

        it('changes state', async () => {
            expect(await bonds.paused()).is.true

            await bonds.unpause()

            expect(await bonds.paused()).is.false
        })

        it('only when paused', async () => {
            await expect(bonds.unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })
    })

    let admin: string
    let treasury: string
    let nonAdmin: SignerWithAddress
    let collateralTokens: ExtendedERC20
    let bonds: BondFactory
})
