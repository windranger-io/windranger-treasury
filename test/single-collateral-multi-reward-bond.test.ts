// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import {before} from 'mocha'
import {BitDAO, SingleCollateralMultiRewardBond} from '../typechain-types'
import {Bond} from '../typechain-types/TimeLockMultiRewardBondBox'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {ExtendedERC20} from './contracts/cast/extended-erc20'
import {deployContract, signer} from './framework/contracts'
import {DAY_IN_SECONDS} from './framework/time'
import {ethers} from 'ethers'
import {expect} from 'chai'
import {successfulTransaction} from './framework/transaction'
import {verifyAllowRedemptionEvent} from './contracts/bond/verify-single-collateral-bond-events'
import {
    verifySetRedemptionTimestampEvents,
    verifySetRedemptionTimestampLogEvents
} from './contracts/bond/verify-time-lock-multi-reward-bond-events'

const TOTAL_SUPPLY = 5000n
const BOND_EXPIRY = 750000n
const MINIMUM_DEPOSIT = 100n

describe('TimeLockMultiRewardBond contract', () => {
    before(async () => {
        admin = await signer(0)
        claimant = await signer(1)
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
        beforeEach(async () => {
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
        it('updates claimant reward debt', async () => {
            // TODO code
        })

        it('emits events', async () => {
            // TODO code
        })
    })

    describe('update reward time lock', () => {
        it('only chosen reward', async () => {
            // TODO code
        })

        it('emits events', async () => {
            // TODO code
        })
    })

    describe('transfer debt tokens', () => {
        it('amount zero', async () => {
            // TODO code
        })

        it('updates claimant reward debt', async () => {
            // TODO code
        })

        it('emits events', async () => {
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

        it('emits events', async () => {
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
    let claimant: SignerWithAddress
    let treasury: string
    let collateralSymbol: string
    let collateralTokens: ExtendedERC20
    let rewardTokenOne: ExtendedERC20
    let rewardTokenTwo: ExtendedERC20
    let rewardTokenThree: ExtendedERC20
})
