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

import {getTimestampNow} from './framework/time'
import {Provider} from '@ethersproject/providers'

// Wires up Waffle with Chai
chai.use(solidity)

describe.only('Floating Staking Tests', () => {
    before(async () => {
        admin = (await signer(0)).address
        user = (await signer(1)).address
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
            epochDuration: 60,
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
            const amount = 20
            await stakeTokens.mint(user, amount * 2)
            // eslint-disable-next-line no-console
            console.log('minted!')
            await stakeTokens.increaseAllowance(
                floatingStakingPool.address,
                amount
            )
            // eslint-disable-next-line no-console
            console.log('depositing!')
            await floatingStakingPool.deposit(amount)
        })
    })

    let admin: string
    let user: string
    let stakeTokens: ERC20PresetMinterPauser
    let floatingStakingPool: FloatingStakingPool
    let provider: Provider
})
