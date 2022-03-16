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
import {BigNumber} from 'ethers'

// Wires up Waffle with Chai
chai.use(solidity)

const EPOCH_DURATION = 60

describe.only('Floating Staking Tests', () => {
    before(async () => {
        admin = (await signer(0)).address
        user = await signer(1)
        const symbol = 'EEK'
        stakeTokens = await deployContract<ERC20PresetMinterPauser>(
            'ERC20PresetMinterPauser',
            'Another erc20 Token',
            symbol
        )

        const floatingStakingPoolInfo = {
            daoId: 0,
            minTotalPoolStake: 50,
            maxTotalPoolStake: 100,
            minimumContribution: 5,
            epochDuration: EPOCH_DURATION,
            epochStartTimestamp: await getTimestampNow(),
            rewardsFinalized: true,
            emergencyMode: false,
            treasury: admin,
            totalStakedAmount: 0,
            stakeToken: stakeTokens.address,
            rewardTokens: []
        }

        floatingStakingPool = await deployContract('FloatingStakingPool')
        // eslint-disable-next-line no-console
        console.log('deployed staking pool at ', floatingStakingPool.address)
        await floatingStakingPool.initialize(floatingStakingPoolInfo)
    })

    describe('deposit', () => {
        it('allows user to deposit', async () => {
            await userDeposit(user, BigNumber.from(20))
        })
    })
    describe('withdraw', () => {
        it('allows user to withdraw', async () => {
            const amount = BigNumber.from(20)
            await userDeposit(user, amount)
            await increaseTime(EPOCH_DURATION)
            await userWithdraw(user)
        })
    })

    async function userDeposit(user: SignerWithAddress, amount: BigNumber) {
        await stakeTokens.mint(user.address, amount)
        await stakeTokens
            .connect(user)
            .increaseAllowance(floatingStakingPool.address, amount)
        await floatingStakingPool.connect(user).deposit(amount)
    }
    async function userWithdraw(user: SignerWithAddress) {
        await floatingStakingPool.connect(user).withdraw()
    }

    let admin: string
    let user: SignerWithAddress
    let stakeTokens: ERC20PresetMinterPauser
    let floatingStakingPool: FloatingStakingPool
})
