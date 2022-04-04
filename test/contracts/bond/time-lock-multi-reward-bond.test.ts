// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {deployContract, signer} from '../../framework/contracts'
import {
    BitDAO,
    IERC20,
    TimeLockMultiRewardBond,
    TimeLockMultiRewardBondBox
} from '../../../typechain-types'
import {successfulTransaction} from '../../framework/transaction'
import {
    ExpectedClaimRewardEvent,
    ExpectedRegisterRewardEvent,
    ExpectedRewardDebtEvent,
    verifyClaimRewardEvents,
    verifyClaimRewardLogEvents,
    verifyRegisterRewardEvents,
    verifyRegisterRewardLogEvents,
    verifyRewardDebtEvents,
    verifyRewardDebtLogEvents
} from '../../event/bond/verify-time-lock-multi-reward-bond-events'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {divideBigNumberish} from '../../framework/maths'
import {ContractReceipt} from '@ethersproject/contracts/src.ts'
import {BigNumber} from 'ethers'
import {verifyERC20TransferEventLogs} from '../../event/erc20/verify-erc20-events'
import {DAY_IN_SECONDS} from '../../framework/time'
import {Bond} from '../../../typechain-types/contracts/bond/BondPortal'

// Wires up Waffle with Chai
chai.use(solidity)

describe('TimeLockMultiRewardBond contract', () => {
    before(async () => {
        admin = await signer(0)
        rewardTokenOne = (await deployContract<BitDAO>(
            'BitDAO',
            admin.address
        )) as IERC20
        rewardTokenTwo = (await deployContract<BitDAO>(
            'BitDAO',
            admin.address
        )) as IERC20
        rewardTokenThree = (await deployContract<BitDAO>(
            'BitDAO',
            admin.address
        )) as IERC20
        claimant = await signer(3)

        rewardPools = [
            {
                tokens: rewardTokenOne.address,
                amount: 100,
                timeLock: 0
            },
            {
                tokens: rewardTokenTwo.address,
                amount: 50000n,
                timeLock: DAY_IN_SECONDS
            },
            {
                tokens: rewardTokenThree.address,
                amount: 75,
                timeLock: 0
            }
        ]

        bond = await deployContract<TimeLockMultiRewardBondBox>(
            'TimeLockMultiRewardBondBox'
        )
        await successfulTransaction(bond.initialize(rewardPools))
    })

    describe('all reward pools', () => {
        it(' match init values', async () => {
            verifyDeepEqualsRewardPools(
                await bond.allRewardPools(),
                rewardPools
            )
        })

        it('unchanged by calculating claimant debt', async () => {
            const totalSupplyDivisor = 10n

            const receipt = await claimantDebt(totalSupplyDivisor)

            verifyDeepEqualsRewardPools(
                await bond.allRewardPools(),
                rewardPools
            )

            const expectedRewardDebtEvents: ExpectedRewardDebtEvent[] = [
                {
                    tokens: rewardPools[0].tokens,
                    claimant: claimant.address,
                    rewardDebt: divideBigNumberish(
                        rewardPools[0].amount,
                        totalSupplyDivisor
                    ),
                    instigator: claimant.address
                },
                {
                    tokens: rewardPools[1].tokens,
                    claimant: claimant.address,
                    rewardDebt: divideBigNumberish(
                        rewardPools[1].amount,
                        totalSupplyDivisor
                    ),
                    instigator: claimant.address
                },
                {
                    tokens: rewardPools[2].tokens,
                    claimant: claimant.address,
                    rewardDebt: divideBigNumberish(
                        rewardPools[2].amount,
                        totalSupplyDivisor
                    ),
                    instigator: claimant.address
                }
            ]

            verifyRewardDebtEvents(receipt, expectedRewardDebtEvents)
            verifyRewardDebtLogEvents(bond, receipt, expectedRewardDebtEvents)
        })
    })

    describe('all available rewards', () => {
        beforeEach(async () => {
            bond = await deployContract<TimeLockMultiRewardBondBox>(
                'TimeLockMultiRewardBondBox'
            )
            await successfulTransaction(bond.initialize(rewardPools))
        })

        it('zeroed when no debt held', async () => {
            verifyDeepEqualsClaimableRewards(
                await bond.connect(claimant).availableRewards(),
                [
                    {
                        tokens: rewardPools[0].tokens,
                        amount: 0
                    },
                    {
                        tokens: rewardPools[1].tokens,
                        amount: 0
                    },
                    {
                        tokens: rewardPools[2].tokens,
                        amount: 0
                    }
                ]
            )
        })

        it('respect time lock', async () => {
            const totalSupplyDivisor = 10n
            await claimantDebt(totalSupplyDivisor)

            await successfulTransaction(bond.setRedemptionTimestamp())

            verifyDeepEqualsClaimableRewards(
                await bond.connect(claimant).availableRewards(),
                [
                    {
                        tokens: rewardPools[0].tokens,
                        amount: divideBigNumberish(
                            rewardPools[0].amount,
                            totalSupplyDivisor
                        )
                    },
                    {
                        tokens: rewardPools[1].tokens,
                        amount: 0
                    },
                    {
                        tokens: rewardPools[2].tokens,
                        amount: divideBigNumberish(
                            rewardPools[2].amount,
                            totalSupplyDivisor
                        )
                    }
                ]
            )
        })
    })

    describe('claim all available rewards', () => {
        beforeEach(async () => {
            bond = await deployContract<TimeLockMultiRewardBondBox>(
                'TimeLockMultiRewardBondBox'
            )
            await successfulTransaction(bond.initialize(rewardPools))
            await rewardTokenOne.transfer(bond.address, rewardPools[0].amount)
            await rewardTokenTwo.transfer(bond.address, rewardPools[1].amount)
            await rewardTokenThree.transfer(bond.address, rewardPools[2].amount)
        })

        it('before redemption timestamp set', async () => {
            await expect(bond.claimAllAvailableRewards()).to.be.revertedWith(
                'Rewards: redemption time not set'
            )
        })

        it('two unlocked rewards', async () => {
            const totalSupplyDivisor = 20n
            const expectedRewardTokenOne = divideBigNumberish(
                rewardPools[0].amount,
                totalSupplyDivisor
            )
            const expectedRewardTokenTwo = divideBigNumberish(
                rewardPools[1].amount,
                totalSupplyDivisor
            )
            const expectedRewardTokenThree = divideBigNumberish(
                rewardPools[2].amount,
                totalSupplyDivisor
            )
            await claimantDebt(totalSupplyDivisor)
            await successfulTransaction(bond.setRedemptionTimestamp())
            expect(
                await bond.rewardDebt(claimant.address, rewardTokenOne.address)
            ).to.equal(expectedRewardTokenOne)
            expect(
                await bond.rewardDebt(claimant.address, rewardTokenTwo.address)
            ).to.equal(expectedRewardTokenTwo)
            expect(
                await bond.rewardDebt(
                    claimant.address,
                    rewardTokenThree.address
                )
            ).to.equal(expectedRewardTokenThree)

            const receipt = await successfulTransaction(
                bond.connect(claimant).claimAllAvailableRewards()
            )

            expect(
                await bond.rewardDebt(claimant.address, rewardTokenOne.address)
            ).to.equal(0)
            expect(
                await bond.rewardDebt(claimant.address, rewardTokenTwo.address)
            ).to.equal(expectedRewardTokenTwo)
            expect(
                await bond.rewardDebt(
                    claimant.address,
                    rewardTokenThree.address
                )
            ).to.equal(0)

            const expectedRewardEvents: ExpectedClaimRewardEvent[] = [
                {
                    tokens: rewardTokenOne.address,
                    amount: expectedRewardTokenOne,
                    instigator: claimant.address
                },
                {
                    tokens: rewardTokenThree.address,
                    amount: expectedRewardTokenThree,
                    instigator: claimant.address
                }
            ]

            verifyClaimRewardEvents(receipt, expectedRewardEvents)
            verifyClaimRewardLogEvents(bond, receipt, expectedRewardEvents)
            verifyERC20TransferEventLogs(rewardTokenOne, receipt, [
                {
                    from: bond.address,
                    to: claimant.address,
                    amount: expectedRewardTokenOne
                }
            ])
            verifyERC20TransferEventLogs(rewardTokenThree, receipt, [
                {
                    from: bond.address,
                    to: claimant.address,
                    amount: expectedRewardTokenThree
                }
            ])
        })
    })

    it('init registers reward pools', async () => {
        bond = await deployContract<TimeLockMultiRewardBondBox>(
            'TimeLockMultiRewardBondBox'
        )
        const receipt = await successfulTransaction(
            bond.initialize(rewardPools)
        )

        const expectedEvents: ExpectedRegisterRewardEvent[] = [
            {
                tokens: rewardPools[0].tokens,
                amount: BigNumber.from(rewardPools[0].amount).toBigInt(),
                timeLock: BigNumber.from(rewardPools[0].timeLock).toBigInt(),
                instigator: admin.address
            },
            {
                tokens: rewardPools[1].tokens,
                amount: BigNumber.from(rewardPools[1].amount).toBigInt(),
                timeLock: BigNumber.from(rewardPools[1].timeLock).toBigInt(),
                instigator: admin.address
            },
            {
                tokens: rewardPools[2].tokens,
                amount: BigNumber.from(rewardPools[2].amount).toBigInt(),
                timeLock: BigNumber.from(rewardPools[2].timeLock).toBigInt(),
                instigator: admin.address
            }
        ]

        verifyRegisterRewardEvents(receipt, expectedEvents)
        verifyRegisterRewardLogEvents(bond, receipt, expectedEvents)
    })

    async function claimantDebt(
        totalSupplyDivisor: bigint
    ): Promise<ContractReceipt> {
        const totalSupply = await bond.totalSupply()
        const debt = totalSupply.div(totalSupplyDivisor)

        return successfulTransaction(bond.connect(claimant).claimantDebt(debt))
    }

    let admin: SignerWithAddress
    let bond: TimeLockMultiRewardBondBox
    let rewardPools: Bond.TimeLockRewardPoolStruct[]
    let claimant: SignerWithAddress
    let rewardTokenOne: IERC20
    let rewardTokenTwo: IERC20
    let rewardTokenThree: IERC20
})

function verifyDeepEqualsRewardPools(
    actual: Bond.TimeLockRewardPoolStructOutput[],
    expected: Bond.TimeLockRewardPoolStruct[]
): void {
    expect(actual.length).equals(expected.length)

    for (let i = 0; i < actual.length; i++) {
        verifyDeepEqualsRewardPool(actual[i], expected[i])
    }
}

function verifyDeepEqualsRewardPool(
    actual: Bond.TimeLockRewardPoolStructOutput,
    expected: Bond.TimeLockRewardPoolStruct
): void {
    expect(actual.tokens).to.equal(expected.tokens)
    expect(actual.amount).to.equal(expected.amount)
    expect(actual.timeLock).to.equal(expected.timeLock)
}

function verifyDeepEqualsClaimableRewards(
    actual: TimeLockMultiRewardBond.ClaimableRewardStructOutput[],
    expected: TimeLockMultiRewardBond.ClaimableRewardStruct[]
): void {
    expect(actual.length).equals(expected.length)

    for (let i = 0; i < actual.length; i++) {
        verifyDeepEqualsClaimableReward(actual[i], expected[i])
    }
}

function verifyDeepEqualsClaimableReward(
    actual: TimeLockMultiRewardBond.ClaimableRewardStructOutput,
    expected: TimeLockMultiRewardBond.ClaimableRewardStruct
): void {
    expect(actual.tokens).to.equal(expected.tokens)
    expect(actual.amount).to.equal(expected.amount)
}
