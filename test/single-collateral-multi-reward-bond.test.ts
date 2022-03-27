// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import {before} from 'mocha'
import {BitDAO, SingleCollateralMultiRewardBond} from '../typechain-types'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ExtendedERC20} from './contracts/cast/extended-erc20'
import {deployContract, signer} from './framework/contracts'
import {DAY_IN_SECONDS} from './framework/time'
import {BigNumber, ethers} from 'ethers'
import {expect} from 'chai'
import {successfulTransaction} from './framework/transaction'
import {
    verifyAllowRedemptionEvent,
    verifyDepositEvent
} from './contracts/bond/verify-single-collateral-bond-events'
import {
    ExpectedUpdateRewardTimeLockEvent,
    verifyRewardDebtEvents,
    verifySetRedemptionTimestampEvents,
    verifySetRedemptionTimestampLogEvents,
    verifySetUpdateRewardTimeLockLogEvents,
    verifyUpdateRewardTimeLockpEvents
} from './contracts/bond/verify-time-lock-multi-reward-bond-events'
import {GuarantorCollateralSetup} from './erc20-single-collateral-bond.test'
import {divideBigNumberish} from './framework/maths'
import {Bond} from '../typechain-types/SingleCollateralMultiRewardBond'

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
        )) as ExtendedERC20
        rewardTokenTwo = (await deployContract<BitDAO>(
            'BitDAO',
            admin.address
        )) as ExtendedERC20
        rewardTokenThree = (await deployContract<BitDAO>(
            'BitDAO',
            admin.address
        )) as ExtendedERC20

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
        )) as ExtendedERC20
        collateralSymbol = await collateralTokens.symbol()

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
            const expectedEvents = [{timestamp: redemptionTime.toBigInt()}]
            verifySetRedemptionTimestampEvents(receipt, expectedEvents)
            verifySetRedemptionTimestampLogEvents(bond, receipt, expectedEvents)
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
                symbol: collateralSymbol,
                amount: pledge
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
                    rewardDebt: rewardOne
                },
                {
                    tokens: rewardPools[1].tokens,
                    claimant: guarantor.address,
                    rewardDebt: rewardTwo
                },
                {
                    tokens: rewardPools[2].tokens,
                    claimant: guarantor.address,
                    rewardDebt: rewardThree
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

            const expectedEvents: ExpectedUpdateRewardTimeLockEvent[] = [
                {tokens: rewardPools[1].tokens, timeLock: updatedTimeLock}
            ]
            verifyUpdateRewardTimeLockpEvents(receipt, expectedEvents)
            verifySetUpdateRewardTimeLockLogEvents(
                bond,
                receipt,
                expectedEvents
            )
        })
    })

    describe('transfer debt tokens', () => {
        it('amount zero', async () => {
            // TODO code
        })

        it('updates claimant reward debt', async () => {
            // TODO code
        })
    })

    describe('redeem debt tokens', () => {
        it('amount zero', async () => {
            // TODO code
        })

        it('updates claimant reward debt', async () => {
            // TODO code
        })
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
    let collateralSymbol: string
    let collateralTokens: ExtendedERC20
    let guarantor: SignerWithAddress
    let rewardTokenOne: ExtendedERC20
    let rewardTokenTwo: ExtendedERC20
    let rewardTokenThree: ExtendedERC20
    let treasury: string
})

async function setupGuarantorWithCollateral(
    guarantor: GuarantorCollateralSetup,
    bond: SingleCollateralMultiRewardBond,
    collateral: ExtendedERC20
) {
    await collateral.transfer(guarantor.signer.address, guarantor.pledge)
    await collateral
        .connect(guarantor.signer)
        .increaseAllowance(bond.address, guarantor.pledge)
}
