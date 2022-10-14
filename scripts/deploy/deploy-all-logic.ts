/* eslint-disable no-console */
import hre, {ethers, run} from 'hardhat'
import {addressEnvironmentVariable} from '../utils/environment-variable'
import {signer} from '../../test/framework/contracts'

// We'll deploy injected versions of these types
import {
    BitDAO,
    PerformanceBondMediator,
    StakingPoolMediator
} from '../../typechain-types'
import {awaitContractPropagation} from '../utils/contract'

// wait period before lockup - then wait additional period before releasing rewards
const waitBeforeLockup = 86400 * 7 // 7 days
const waitBeforeRewards = 86400 * 7 // 7 days

// get timestamp from the chain to avoid out-of-sync errors
const now = async () => {
    // getting timestamp
    const blockNumBefore = await ethers.provider.getBlockNumber()
    const blockBefore = await ethers.provider.getBlock(blockNumBefore)

    return blockBefore.timestamp
}

export const setup = (
    deployBitDao: () => Promise<BitDAO>,
    deployPerformanceBonds: (
        _tokenSweepBeneficiary: string
    ) => Promise<PerformanceBondMediator>,
    deployStakingPool: (
        _tokenSweepBeneficiary: string
    ) => Promise<StakingPoolMediator>,
    // if we're not verifying we can reduce the sleepyTimeMs (for localhost we can use 0)
    sleepyTimeMs = 15000
): (() => Promise<void>) =>
    async function main() {
        // this address can sweep all contracts and will be provided Roles and BIT tokens
        const tokenSweepBeneficiary = addressEnvironmentVariable(
            'TOKEN_SWEEP_BENEFICIARY'
        )
        await run('compile')

        // get current time
        let nowts = await now()

        // record deployment start ts
        const startts = nowts

        // take reference of the deployer
        const deployer = await signer(0)

        // deploy core contracts
        const bitdao = await deployBitDao()

        // deploy the Performace Bonds factory + mediator then retrieve addresses
        const bondMediator = await deployPerformanceBonds(tokenSweepBeneficiary)
        const bondFactory = await bondMediator.bondCreator()

        // deploy the Staking Pool factory + mediator then retrieve addresses
        const poolMediator = await deployStakingPool(tokenSweepBeneficiary)
        const poolFactory = await poolMediator.stakingPoolCreator()

        // set up the test account...
        if (
            deployer.address.toLowerCase() !==
            tokenSweepBeneficiary.toLowerCase()
        ) {
            // transfer native currency to the tokenSweepBeneficiary
            await deployer.sendTransaction({
                to: tokenSweepBeneficiary,
                value: ethers.utils.parseEther('1')
            })

            //  transfer 10000 BIT to tokenSweepBeneficiary
            await bitdao.transfer(
                tokenSweepBeneficiary,
                `${ethers.utils.parseUnits('10000', 18).toString()}`
            )

            // set role for tokenSweepBeneficiary (SUPER_ADMIN)
            await poolMediator.grantSuperUserRole(tokenSweepBeneficiary)
        }

        // createDao (BitDAO with string of json metadata)
        const createDao = await poolMediator.createDao(
            bitdao.address,
            '{ "name": "BitDAO", "about": "Leverage agile frameworks to provide a robust synopsis for high level overviews. Iterative approaches to corporate strategy foster collaborative thinking to further the overall value proposition. Organically grow the holistic world view of disruptive innovation via workplace diversity and empowerment.", "website": "https://bitdao.io/", "snapshot": "https://snapshot.org/#/bitdao.eth", "twitter": "https://twitter.com/BitDAO_Official", "github": "https://github.com/bitdao-io", "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/11221.png", "slug": "bitdao", "discord": null }'
        )
        const createDaoTx = await createDao.wait()

        // decode createDao logs
        const createDaoAbi = [
            'event CreateDao(uint256 indexed id,address indexed treasury,address indexed instigator)'
        ]
        const createDaoiFace = new ethers.utils.Interface(createDaoAbi)
        const createDaoRes = createDaoiFace.parseLog(createDaoTx.logs[2])

        // get the daos id
        const daoid = createDaoRes.args.id as string

        // whitelist the stake token
        await poolMediator.whitelistCollateral(daoid, bitdao.address)

        // createPool - fixed (one week before available)
        nowts = await now()
        const pool1Rewards = [
            {
                tokens: bitdao.address,
                maxAmount: `${ethers.utils.parseUnits(`20000`, 18).toString()}`,
                ratio: '2' // ratio and maxAmount are fixed
            }
        ]
        await poolMediator.createManagedStakingPool(
            {
                daoId: daoid,
                minTotalPoolStake: '0',
                maxTotalPoolStake: `${ethers.utils
                    .parseUnits('10000', 18)
                    .toString()}`,
                // eslint-disable-next-line prettier/prettier
                minimumContribution: `${1 * (10 ** 18)}`,
                // 1 week to pay-in - then 1 week lock
                epochStartTimestamp: `${nowts + waitBeforeLockup}`,
                epochDuration: `${waitBeforeRewards}`,
                treasury: bitdao.address,
                stakeToken: bitdao.address,
                rewardTokens: pool1Rewards,
                rewardType: '1'
            },
            false,
            // eslint-disable-next-line prettier/prettier
            `${nowts + 1 + waitBeforeLockup + waitBeforeRewards}`
        )

        // createPool - fixed (one week before available)
        nowts = await now()
        const pool2Rewards = [
            {
                tokens: bitdao.address,
                maxAmount: `${ethers.utils.parseUnits(`20000`, 18).toString()}`,
                ratio: '2' // ratio and maxAmount are fixed
            }
        ]
        await poolMediator.createManagedStakingPool(
            {
                daoId: daoid,
                minTotalPoolStake: '0',
                maxTotalPoolStake: `${ethers.utils
                    .parseUnits('10000', 18)
                    .toString()}`,
                // eslint-disable-next-line prettier/prettier
                minimumContribution: `${1 * (10 ** 18)}`,
                // 1 week to pay-in - then 1 week lock
                epochStartTimestamp: `${nowts + waitBeforeLockup + 60}`,
                epochDuration: `${waitBeforeRewards}`,
                treasury: bitdao.address,
                stakeToken: bitdao.address,
                rewardTokens: pool2Rewards,
                rewardType: '1'
            },
            false,
            // eslint-disable-next-line prettier/prettier
            `${nowts + 1 + waitBeforeLockup + waitBeforeRewards + 60}`
        )

        // createPool - floating (one week before available)
        nowts = await now()
        const pool3Rewards = [
            {
                tokens: bitdao.address,
                maxAmount: `${ethers.utils.parseUnits(`20000`, 18).toString()}`,
                ratio: '0' // ratio is calculated from maxAmount and stakeAmount
            }
        ]
        await poolMediator.createManagedStakingPool(
            {
                daoId: daoid,
                minTotalPoolStake: `${ethers.utils
                    .parseUnits('1000', 18)
                    .toString()}`,
                maxTotalPoolStake: `${ethers.utils
                    .parseUnits('10000', 18)
                    .toString()}`,
                // eslint-disable-next-line prettier/prettier
                minimumContribution: `${1 * (10 ** 18)}`,
                // eg 1 week to pay-in - then 1 week lock
                epochStartTimestamp: `${nowts + waitBeforeLockup + 120}`,
                epochDuration: waitBeforeRewards,
                treasury: bitdao.address,
                stakeToken: bitdao.address,
                rewardTokens: pool3Rewards,
                rewardType: '2'
            },
            false,
            // eslint-disable-next-line prettier/prettier
            `${nowts + 1 + waitBeforeLockup + waitBeforeRewards + 120}`
        )

        // createPool - floating (one week before available)
        nowts = await now()
        const pool4Rewards = [
            {
                tokens: bitdao.address,
                maxAmount: `${ethers.utils.parseUnits(`20000`, 18).toString()}`,
                ratio: '0' // ratio is calculated from maxAmount and stakeAmount
            }
        ]
        await poolMediator.createManagedStakingPool(
            {
                daoId: daoid,
                minTotalPoolStake: `${ethers.utils
                    .parseUnits('1000', 18)
                    .toString()}`,
                maxTotalPoolStake: `${ethers.utils
                    .parseUnits('10000', 18)
                    .toString()}`,
                // eslint-disable-next-line prettier/prettier
                minimumContribution: `${1 * (10 ** 18)}`,
                // eg 1 week to pay-in - then 1 week lock
                epochStartTimestamp: `${nowts + waitBeforeLockup + 180}`,
                epochDuration: waitBeforeRewards,
                treasury: bitdao.address,
                stakeToken: bitdao.address,
                rewardTokens: pool4Rewards,
                rewardType: '2'
            },
            false,
            // eslint-disable-next-line prettier/prettier
            `${nowts + 1 + waitBeforeLockup + waitBeforeRewards + 180}`
        )

        // want to wait a minute here for the contracts to finish deploying (dont need to wait on local)
        if (hre.network.config.chainId !== 33133) {
            await awaitContractPropagation(60000)
        }

        // get the deployed addresses of all pools
        const pool1 = await poolMediator.stakingPoolAt(daoid, 0)
        const pool2 = await poolMediator.stakingPoolAt(daoid, 1)
        const pool3 = await poolMediator.stakingPoolAt(daoid, 2)
        const pool4 = await poolMediator.stakingPoolAt(daoid, 3)

        // approved spending...
        await bitdao.approve(
            pool1,
            `${ethers.utils.parseUnits('20000', 18).toString()}`
        )
        await bitdao.approve(
            pool2,
            `${ethers.utils.parseUnits('20000', 18).toString()}`
        )
        await bitdao.approve(
            pool3,
            `${ethers.utils.parseUnits('20000', 18).toString()}`
        )
        await bitdao.approve(
            pool4,
            `${ethers.utils.parseUnits('20000', 18).toString()}`
        )

        // wait for txs to reflect (dont need to wait on local)
        if (hre.network.config.chainId !== 33133) {
            await awaitContractPropagation(sleepyTimeMs)
        }

        // initialise rewards (move funds in for each reward set)
        await poolMediator.stakingPoolInitializeRewardTokens(
            daoid,
            pool1,
            deployer.address,
            pool1Rewards
        )
        await poolMediator.stakingPoolInitializeRewardTokens(
            daoid,
            pool2,
            deployer.address,
            pool2Rewards
        )
        await poolMediator.stakingPoolInitializeRewardTokens(
            daoid,
            pool3,
            deployer.address,
            pool3Rewards
        )
        await poolMediator.stakingPoolInitializeRewardTokens(
            daoid,
            pool4,
            deployer.address,
            pool4Rewards
        )

        // done
        nowts = await now()

        // log all the contract addresses - these to need to be updated in the subgraph
        console.log(`
        -- start: ${startts}
        -
        --- BITDAO Token: ${bitdao.address}
        -
        --- BondFactory: ${bondFactory}
        --- BondMediator: ${bondMediator.address}
        -
        --- StakingPoolFactory: ${poolFactory}
        --- StakingPoolMediator: ${poolMediator.address}
        -
        ---- DAOID: ${daoid}
        -
        ----- Pool1: ${pool1}
        ----- Pool2: ${pool2}
        ----- Pool3: ${pool3}
        ----- Pool4: ${pool4}
        -
        -- fin: ${nowts}
        `)
    }
