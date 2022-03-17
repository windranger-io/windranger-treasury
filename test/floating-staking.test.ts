// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {
    BitDAO,
    FloatingStakingPool,
    BondCuratorBox,
    ERC20SingleCollateralBond,
    ERC20PresetMinterPauser
} from '../typechain-types'
import {
    deployContract,
    deployContractWithProxy,
    execute,
    signer
} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'

import {getTimestampNow, increaseTime} from './framework/time'
import {Provider} from '@ethersproject/providers'
import {BigNumber, ContractReceipt} from 'ethers'
import {float} from 'hardhat/internal/core/params/argumentTypes'
import {
    verifyDepositEvent,
    verifyWithdrawEvent
} from './contracts/staking/verify-staking-events'

// Wires up Waffle with Chai
chai.use(solidity)

const EPOCH_DURATION = 60
const START_DELAY = 15

describe.only('Floating Staking Tests', () => {
    before(async () => {
        admin = (await signer(0)).address
        user = await signer(1)
        user2 = await signer(2)
        const symbol = 'EEK'
        stakeTokens = await deployContract<ERC20PresetMinterPauser>(
            'ERC20PresetMinterPauser',
            'Another erc20 Token',
            symbol
        )
        const epochStartTimestamp = (await getTimestampNow()) + START_DELAY

        const floatingStakingPoolInfo = {
            daoId: 0,
            minTotalPoolStake: 50,
            maxTotalPoolStake: 100,
            minimumContribution: 5,
            epochDuration: EPOCH_DURATION,
            epochStartTimestamp,
            rewardsFinalized: true,
            emergencyMode: false,
            treasury: admin,
            totalStakedAmount: 0,
            stakeToken: stakeTokens.address,
            rewardTokens: []
        }

        floatingStakingPool = await deployContract('FloatingStakingPool')
        await floatingStakingPool.initialize(floatingStakingPoolInfo)
    })

    describe('deposit', () => {
        const depositAmount = BigNumber.from(20)

        it('does not allow user to deposit when stakingPeriodNotStarted', async () => {
            await expect(userDeposit(user, depositAmount)).to.be.revertedWith(
                'StakingPool: too early'
            )
        })

        it('does not allow user to deposit when staking pool full', async () => {
            await increaseTime(START_DELAY)
            await expect(
                userDeposit(user, BigNumber.from(100n))
            ).to.be.revertedWith('StakingPool: pool full')
        })

        it('does not allow user to deposit when amount less than min contribution', async () => {
            await increaseTime(START_DELAY)
            await expect(
                userDeposit(user, BigNumber.from(4))
            ).to.be.revertedWith('StakingPool: min contribution')
        })

        it('allows user to deposit', async () => {
            const depositReceipt = await userDeposit(user, depositAmount)
            verifyDepositEvent(
                {depositAmount, user: user.address},
                depositReceipt
            )
        })

        it('allows user to deposit again', async () => {
            await userDeposit(user, depositAmount)
        })
    })
    describe('withdraw', () => {
        const amount = BigNumber.from(20)
        it('cant withdraw since rewards have not been finalized', async () => {
            await increaseTime(START_DELAY)
            await floatingStakingPool.setFinalizeRewards(false)
            await expect(userWithdraw(user)).to.be.revertedWith(
                'StakingPool: not finalized'
            )
        })

        it('cant withdraw staking period not complete', async () => {
            await successfulTransaction(
                floatingStakingPool.setFinalizeRewards(true)
            )
            await expect(userWithdraw(user)).to.be.revertedWith(
                'StakingPool: still stake period'
            )
        })

        it('allows a user to withdraw', async () => {
            await userDeposit(user2, amount)
            await floatingStakingPool.setFinalizeRewards(true)
            await increaseTime(EPOCH_DURATION)
            const withdrawReceipt = await userWithdraw(user2)
            verifyWithdrawEvent(
                {user: user2.address, stake: amount},
                withdrawReceipt
            )
        })

        it('doesnt allow a user to withdraw twice', async () => {
            await expect(userWithdraw(user2)).to.be.revertedWith(
                'StakingPool: not eligible'
            )
        })
    })

    async function userDeposit(
        user: SignerWithAddress,
        amount: BigNumber
    ): Promise<ContractReceipt> {
        await stakeTokens.mint(user.address, amount)
        await stakeTokens
            .connect(user)
            .increaseAllowance(floatingStakingPool.address, amount)
        return successfulTransaction(
            floatingStakingPool.connect(user).deposit(amount)
        )
    }
    async function userWithdraw(
        user: SignerWithAddress
    ): Promise<ContractReceipt> {
        return successfulTransaction(
            floatingStakingPool.connect(user).withdraw()
        )
    }

    let admin: string
    let user: SignerWithAddress
    let user2: SignerWithAddress
    let stakeTokens: ERC20PresetMinterPauser
    let floatingStakingPool: FloatingStakingPool
})
