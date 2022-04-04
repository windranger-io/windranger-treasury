// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import {before} from 'mocha'
import {
    BitDAO,
    ERC20,
    SingleCollateralMultiRewardBond
} from '../../../typechain-types'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {deployContract, signer} from '../../framework/contracts'
import {DAY_IN_SECONDS} from '../../framework/time'
import {BigNumber, ethers} from 'ethers'
import {expect} from 'chai'
import {successfulTransaction} from '../../framework/transaction'
import {
    verifyAllowRedemptionEvent,
    verifyDepositEvent,
    verifyRedemptionEvent
} from '../../event/bond/verify-single-collateral-bond-events'
import {
    ExpectedRewardDebtEvent,
    ExpectedRewardTimeLockUpdateEvent,
    verifyRewardDebtEvents,
    verifyRewardDebtLogEvents,
    verifyRedemptionTimestampUpdateEvents,
    verifyRedemptionTimestampUpdateLogEvents,
    verifyRewardTimeLockUpdateLogEvents,
    verifyRewardTimeLockUpdateEvents
} from '../../event/bond/verify-time-lock-multi-reward-bond-events'
import {GuarantorCollateralSetup} from './erc20-single-collateral-bond.test'
import {divideBigNumberish} from '../../framework/maths'
import {countEvents} from '../../framework/events'
import {Bond} from '../../../typechain-types/contracts/bond/BondPortal'

const TOTAL_SUPPLY = 5000n
const BOND_EXPIRY = 750000n
const MINIMUM_DEPOSIT = 100n

describe('Single Collateral TimeLock Multi Reward Bond contract', () => {
    before(async () => {
        admin = await signer(0)
        guarantor = await signer(1)
        treasury = (await signer(2)).address

        rewardTokenOne = (await deployContract<BitDAO>(
            'BitDAO',
            admin.address
        )) as ERC20
        rewardTokenTwo = (await deployContract<BitDAO>(
            'BitDAO',
            admin.address
        )) as ERC20
        rewardTokenThree = (await deployContract<BitDAO>(
            'BitDAO',
            admin.address
        )) as ERC20

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

        collateralTokens = (await deployContract<BitDAO>(
            'BitDAO',
            admin.address
        )) as ERC20

        bond = await createBond()
    })

    describe('allow redemption', () => {
        afterEach(async () => {
            bond = await createBond()
        })
        it('sets as redeemable ', async () => {
            const reason = 'any old redemption reason'
            expect(await bond.redeemable()).is.false

            const receipt = await successfulTransaction(
                bond.allowRedemption(reason)
            )

            expect(await bond.redeemable()).is.true
            verifyAllowRedemptionEvent(receipt, {
                authorizer: admin.address,
                reason: reason
            })
        })

        it('sets redemption timestamp', async () => {
            const reason = 'any old redemption reason'
            expect((await bond.redemptionTimestamp()).gt(0)).is.false

            const receipt = await successfulTransaction(
                bond.allowRedemption(reason)
            )

            const redemptionTime = await bond.redemptionTimestamp()
            expect(redemptionTime.gt(0)).is.true
            const expectedEvents = [
                {
                    timestamp: redemptionTime.toBigInt(),
                    instigator: admin.address
                }
            ]
            verifyRedemptionTimestampUpdateEvents(receipt, expectedEvents)
            verifyRedemptionTimestampUpdateLogEvents(
                bond,
                receipt,
                expectedEvents
            )
        })
    })

    describe('deposit', () => {
        afterEach(async () => {
            bond = await createBond()
        })
        before(() => {
            divisor = 10n
            pledge = TOTAL_SUPPLY / divisor
        })
        beforeEach(async () => {
            await setupGuarantorWithCollateral(
                {signer: guarantor, pledge: pledge},
                bond,
                collateralTokens
            )
        })

        it('transfers debt tokens', async () => {
            const beforeCollateralBalance = await collateralTokens.balanceOf(
                guarantor.address
            )
            const beforeDebtBalance = await bond.balanceOf(guarantor.address)

            const receipt = await successfulTransaction(
                bond.connect(guarantor).deposit(pledge)
            )

            expect(await bond.balanceOf(guarantor.address)).equals(
                beforeDebtBalance.add(pledge)
            )
            expect(await collateralTokens.balanceOf(guarantor.address)).equals(
                beforeCollateralBalance.sub(pledge)
            )

            verifyDepositEvent(receipt, guarantor.address, {
                tokens: collateralTokens.address,
                amount: pledge,
                instigator: guarantor.address
            })
        })

        it('updates claimant reward debt', async () => {
            const beforeRewardDebtOne = await bond.rewardDebt(
                guarantor.address,
                rewardPools[0].tokens
            )
            const beforeRewardDebtTwo = await bond.rewardDebt(
                guarantor.address,
                rewardPools[1].tokens
            )
            const beforeRewardDebtThree = await bond.rewardDebt(
                guarantor.address,
                rewardPools[2].tokens
            )
            expect(beforeRewardDebtOne).equals(0)
            expect(beforeRewardDebtTwo).equals(0)
            expect(beforeRewardDebtThree).equals(0)

            const receipt = await successfulTransaction(
                bond.connect(guarantor).deposit(pledge)
            )

            const rewardOne = divideBigNumberish(rewardPools[0].amount, divisor)
            const rewardTwo = divideBigNumberish(rewardPools[1].amount, divisor)
            const rewardThree = divideBigNumberish(
                rewardPools[2].amount,
                divisor
            )
            expect(
                await bond.rewardDebt(guarantor.address, rewardPools[0].tokens)
            ).equals(rewardOne)
            expect(
                await bond.rewardDebt(guarantor.address, rewardPools[1].tokens)
            ).equals(rewardTwo)
            expect(
                await bond.rewardDebt(guarantor.address, rewardPools[2].tokens)
            ).equals(rewardThree)

            verifyRewardDebtEvents(receipt, [
                {
                    tokens: rewardPools[0].tokens,
                    claimant: guarantor.address,
                    rewardDebt: rewardOne,
                    instigator: guarantor.address
                },
                {
                    tokens: rewardPools[1].tokens,
                    claimant: guarantor.address,
                    rewardDebt: rewardTwo,
                    instigator: guarantor.address
                },
                {
                    tokens: rewardPools[2].tokens,
                    claimant: guarantor.address,
                    rewardDebt: rewardThree,
                    instigator: guarantor.address
                }
            ])
        })

        let pledge: bigint
        let divisor: bigint
    })

    describe('update reward time lock', () => {
        it('only chosen reward', async () => {
            const updatedTimeLock = 55678n
            const beforePools = await bond.allRewardPools()

            const receipt = await successfulTransaction(
                bond.updateRewardTimeLock(
                    rewardPools[1].tokens,
                    updatedTimeLock
                )
            )

            const afterPools = await bond.allRewardPools()
            expect(afterPools.length).equals(beforePools.length)
            expect(afterPools[0]).deep.equal(beforePools[0])
            expect(afterPools[1].tokens).equals(beforePools[1].tokens)
            expect(afterPools[1].amount).equals(beforePools[1].amount)
            expect(afterPools[1].timeLock).equals(
                BigNumber.from(updatedTimeLock)
            )
            expect(afterPools[2]).to.deep.equal(beforePools[2])

            const expectedEvents: ExpectedRewardTimeLockUpdateEvent[] = [
                {
                    tokens: rewardPools[1].tokens,
                    timeLock: updatedTimeLock,
                    instigator: admin.address
                }
            ]
            verifyRewardTimeLockUpdateEvents(receipt, expectedEvents)
            verifyRewardTimeLockUpdateLogEvents(bond, receipt, expectedEvents)
        })
    })

    describe('transfer debt tokens', () => {
        afterEach(async () => {
            bond = await createBond()
        })
        before(async () => {
            divisor = 22n
            pledge = TOTAL_SUPPLY / divisor
            debtPurchaser = (await signer(9)).address
        })
        beforeEach(async () => {
            await setupGuarantorWithCollateral(
                {signer: guarantor, pledge: pledge},
                bond,
                collateralTokens
            )
            await successfulTransaction(bond.connect(guarantor).deposit(pledge))
        })

        describe('after redemption allowed', () => {
            it('amount zero', async () => {
                const receipt = await successfulTransaction(
                    bond.connect(guarantor).transfer(debtPurchaser, 0)
                )

                expect(countEvents('RewardDebt', receipt)).equals(0)
            })
            it('no update of claimant reward debt', async () => {
                await successfulTransaction(bond.allowRedemption(''))
                const rewardOne = await bond.rewardDebt(
                    guarantor.address,
                    rewardPools[0].tokens
                )
                const rewardTwo = await bond.rewardDebt(
                    guarantor.address,
                    rewardPools[1].tokens
                )
                const rewardThree = await bond.rewardDebt(
                    guarantor.address,
                    rewardPools[2].tokens
                )
                expect(await bond.balanceOf(guarantor.address)).equals(pledge)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[0].tokens
                    )
                ).equals(rewardOne)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[1].tokens
                    )
                ).equals(rewardTwo)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[2].tokens
                    )
                ).equals(rewardThree)
                expect(await bond.balanceOf(debtPurchaser)).equals(0)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[0].tokens)
                ).equals(0)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[1].tokens)
                ).equals(0)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[2].tokens)
                ).equals(0)

                await successfulTransaction(
                    bond.connect(guarantor).transfer(debtPurchaser, pledge)
                )

                expect(await bond.balanceOf(guarantor.address)).equals(0)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[0].tokens
                    )
                ).equals(rewardOne)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[1].tokens
                    )
                ).equals(rewardTwo)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[2].tokens
                    )
                ).equals(rewardThree)
                expect(await bond.balanceOf(debtPurchaser)).equals(pledge)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[0].tokens)
                ).equals(0)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[1].tokens)
                ).equals(0)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[2].tokens)
                ).equals(0)
            })
        })

        describe('before redemption', () => {
            after(async () => {
                bond = await createBond()
            })
            it('amount zero', async () => {
                const receipt = await successfulTransaction(
                    bond.connect(guarantor).transfer(debtPurchaser, 0)
                )

                expect(countEvents('RewardDebt', receipt)).equals(0)
            })
            it('updates claimant reward debt', async () => {
                const rewardOne = await bond.rewardDebt(
                    guarantor.address,
                    rewardPools[0].tokens
                )
                const rewardTwo = await bond.rewardDebt(
                    guarantor.address,
                    rewardPools[1].tokens
                )
                const rewardThree = await bond.rewardDebt(
                    guarantor.address,
                    rewardPools[2].tokens
                )
                expect(await bond.balanceOf(guarantor.address)).equals(pledge)
                expect(await bond.balanceOf(debtPurchaser)).equals(0)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[0].tokens
                    )
                ).equals(rewardOne)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[1].tokens
                    )
                ).equals(rewardTwo)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[2].tokens
                    )
                ).equals(rewardThree)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[0].tokens)
                ).equals(0)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[1].tokens)
                ).equals(0)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[2].tokens)
                ).equals(0)

                const receipt = await successfulTransaction(
                    bond.connect(guarantor).transfer(debtPurchaser, pledge)
                )

                expect(await bond.balanceOf(guarantor.address)).equals(0)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[0].tokens
                    )
                ).equals(0)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[1].tokens
                    )
                ).equals(0)
                expect(
                    await bond.rewardDebt(
                        guarantor.address,
                        rewardPools[2].tokens
                    )
                ).equals(0)
                expect(await bond.balanceOf(debtPurchaser)).equals(pledge)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[0].tokens)
                ).equals(rewardOne)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[1].tokens)
                ).equals(rewardTwo)
                expect(
                    await bond.rewardDebt(debtPurchaser, rewardPools[2].tokens)
                ).equals(rewardThree)

                const expectedRewardDebtEvents: ExpectedRewardDebtEvent[] = [
                    {
                        tokens: rewardPools[0].tokens,
                        claimant: guarantor.address,
                        rewardDebt: 0n,
                        instigator: guarantor.address
                    },
                    {
                        tokens: rewardPools[1].tokens,
                        claimant: guarantor.address,
                        rewardDebt: 0n,
                        instigator: guarantor.address
                    },
                    {
                        tokens: rewardPools[2].tokens,
                        claimant: guarantor.address,
                        rewardDebt: 0n,
                        instigator: guarantor.address
                    },
                    {
                        tokens: rewardPools[0].tokens,
                        claimant: debtPurchaser,
                        rewardDebt: rewardOne.toBigInt(),
                        instigator: guarantor.address
                    },
                    {
                        tokens: rewardPools[1].tokens,
                        claimant: debtPurchaser,
                        rewardDebt: rewardTwo.toBigInt(),
                        instigator: guarantor.address
                    },
                    {
                        tokens: rewardPools[2].tokens,
                        claimant: debtPurchaser,
                        rewardDebt: rewardThree.toBigInt(),
                        instigator: guarantor.address
                    }
                ]
                verifyRewardDebtEvents(receipt, expectedRewardDebtEvents)
                verifyRewardDebtLogEvents(
                    bond,
                    receipt,
                    expectedRewardDebtEvents
                )
            })
        })

        let pledge: bigint
        let divisor: bigint
        let debtPurchaser: string
    })

    describe('redeem debt tokens', () => {
        afterEach(async () => {
            bond = await createBond()
        })
        before(() => {
            divisor = 35n
            pledge = TOTAL_SUPPLY / divisor
        })
        beforeEach(async () => {
            await setupGuarantorWithCollateral(
                {signer: guarantor, pledge: pledge},
                bond,
                collateralTokens
            )
            await successfulTransaction(bond.connect(guarantor).deposit(pledge))
            await successfulTransaction(bond.allowRedemption(''))
        })

        it('amount zero', async () => {
            expect(await bond.balanceOf(guarantor.address)).equals(pledge)

            await expect(bond.connect(guarantor).redeem(0)).to.be.revertedWith(
                'Bond: too small'
            )
        })

        it('updates claimant reward debt', async () => {
            expect(await bond.balanceOf(guarantor.address)).equals(pledge)
            const beforeRewardsOne = await bond.rewardDebt(
                guarantor.address,
                rewardPools[0].tokens
            )
            const beforeRewardsTwo = await bond.rewardDebt(
                guarantor.address,
                rewardPools[1].tokens
            )
            const beforeRewardsThree = await bond.rewardDebt(
                guarantor.address,
                rewardPools[2].tokens
            )

            const receipt = await successfulTransaction(
                bond.connect(guarantor).redeem(pledge)
            )

            expect(await bond.balanceOf(guarantor.address)).equals(0)
            expect(
                await bond.rewardDebt(guarantor.address, rewardPools[0].tokens)
            ).equals(beforeRewardsOne)
            expect(
                await bond.rewardDebt(guarantor.address, rewardPools[1].tokens)
            ).equals(beforeRewardsTwo)
            expect(
                await bond.rewardDebt(guarantor.address, rewardPools[2].tokens)
            ).equals(beforeRewardsThree)

            verifyRedemptionEvent(
                receipt,
                guarantor.address,
                {
                    tokens: bond.address,
                    amount: pledge,
                    instigator: admin.address
                },
                {
                    tokens: collateralTokens.address,
                    amount: pledge,
                    instigator: admin.address
                }
            )
        })

        let pledge: bigint
        let divisor: bigint
    })

    async function createBond(): Promise<SingleCollateralMultiRewardBond> {
        const bond = await deployContract<SingleCollateralMultiRewardBond>(
            'SingleCollateralMultiRewardBond'
        )
        expect(ethers.utils.isAddress(bond.address)).is.true

        await bond.initialize(
            {
                name: 'My Debt Tokens two',
                symbol: 'MDT007',
                data: ''
            },
            {
                debtTokenAmount: TOTAL_SUPPLY,
                collateralTokens: collateralTokens.address,
                expiryTimestamp: BOND_EXPIRY,
                minimumDeposit: MINIMUM_DEPOSIT
            },
            rewardPools,
            treasury
        )

        return bond
    }

    let admin: SignerWithAddress
    let bond: SingleCollateralMultiRewardBond
    let rewardPools: Bond.TimeLockRewardPoolStruct[]
    let collateralTokens: ERC20
    let guarantor: SignerWithAddress
    let rewardTokenOne: ERC20
    let rewardTokenTwo: ERC20
    let rewardTokenThree: ERC20
    let treasury: string
})

async function setupGuarantorWithCollateral(
    guarantor: GuarantorCollateralSetup,
    bond: SingleCollateralMultiRewardBond,
    collateral: ERC20
) {
    await collateral.transfer(guarantor.signer.address, guarantor.pledge)
    await collateral
        .connect(guarantor.signer)
        .increaseAllowance(bond.address, guarantor.pledge)
}
