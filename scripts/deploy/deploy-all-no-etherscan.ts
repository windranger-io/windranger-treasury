import {ethers, run} from 'hardhat'
import {log} from '../../config/logging'
import {deployBitDao} from './bitdao-deploy-no-etherscan'
import {deployPerformanceBonds} from './bond-deploy-no-etherscan'
import {addressEnvironmentVariable} from '../utils/environment-variable'
import {deployStakingPool} from './staking-pool-deploy-no-etherscan'
import {signer} from '../../test/framework/contracts'

// address to use for testing (this wallet will be loaded with BitDAO tokens to test positions)
const tester = '0xDe9007A43772a745C434F9Eb6C519132Db2b14A5'

// wait period before lockup - then wait additional period before releasing rewards
const waitBeforeLockup = 60 * 5 // 5 mins
const waitBeforeRewards = 10 // 10 secs (these pools are locked for only 10seconds)

// get timestamp from the chain to avoid out-of-sync errors
const now = async () => {
    // getting timestamp
    const blockNumBefore = await ethers.provider.getBlockNumber()
    const blockBefore = await ethers.provider.getBlock(blockNumBefore)

    return blockBefore.timestamp
}

async function main() {
    const tokenSweepBeneficiary = addressEnvironmentVariable(
        'TOKEN_SWEEP_BENEFICIARY'
    )
    await run('compile')

    // transfer funds to test wallet
    const deployer = await signer(0)
    await deployer.sendTransaction({
        to: tester,
        value: ethers.utils.parseEther('1') // 1 ether
    })

    // get current time
    let nowts = await now()

    // record deployment start ts
    const startts = nowts

    // deploy core contracts
    const bitdao = await deployBitDao()

    const bondMediator = await deployPerformanceBonds(tokenSweepBeneficiary)
    const bondFactory = await bondMediator.bondCreator()

    const poolMediator = await deployStakingPool(tokenSweepBeneficiary)
    const poolFactory = await poolMediator.stakingPoolCreator()

    // set role for tester (SUPER_ADMIN)
    await poolMediator.grantSuperUserRole(tester)

    // transfer 10000 to tester
    await bitdao.transfer(
        tester,
        `${ethers.utils.parseUnits('10000', 18).toString()}`
    )

    // createDao
    const createDao = await poolMediator.createDao(
        bitdao.address,
        '{ "name": "BitDAO", "about": "Leverage agile frameworks to provide a robust synopsis for high level overviews. Iterative approaches to corporate strategy foster collaborative thinking to further the overall value proposition. Organically grow the holistic world view of disruptive innovation via workplace diversity and empowerment.", "website": "https://bitdao.io/", "snapshot": "https://snapshot.org/#/bitdao.eth", "twitter": "https://twitter.com/BitDAO_Official", "github": "https://github.com/bitdao-io", "logo": "https://ipfs.io/ipfs/Qmd9imntULpTZ2AMkhiRjJ4mhMBxSxfi1SfMmQ9JUvSd9J", "slug": "bitdao", "discord": null }'
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

    // createPool - floating (one week before available)
    nowts = await now()
    const pool2Rewards = [
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
            epochStartTimestamp: `${nowts + waitBeforeLockup}`,
            epochDuration: waitBeforeRewards,
            treasury: bitdao.address,
            stakeToken: bitdao.address,
            rewardTokens: pool2Rewards,
            rewardType: '2'
        },
        false,
        // eslint-disable-next-line prettier/prettier
        `${nowts + 1 + waitBeforeLockup + waitBeforeRewards}`
    )

    // get the deployed addresses of both pools
    const pool1 = await poolMediator.stakingPoolAt(daoid, 0)
    const pool2 = await poolMediator.stakingPoolAt(daoid, 1)

    // approved spending...
    await bitdao.approve(
        pool1,
        `${ethers.utils.parseUnits('20000', 18).toString()}`
    )
    await bitdao.approve(
        pool2,
        `${ethers.utils.parseUnits('20000', 18).toString()}`
    )

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

    // done
    nowts = await now()

    // log all the contract addresses - these to need to be updated in the subgraph
    // eslint-disable-next-line no-console
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
    -
    -- fin: ${nowts}
    `)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log.error(error)
        process.exit(1)
    })
