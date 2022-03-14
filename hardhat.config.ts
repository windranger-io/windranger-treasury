import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'
import {task} from 'hardhat/config'
import {log} from './config/logging'
import {createDao} from './scripts/local/create-dao'
import {createBond} from './scripts/local/create-bond'

/*
 * This is a sample Hardhat task. To learn how to create your own go to https://hardhat.org/guides/create-task.html
 */
task('accounts', 'Prints the list of accounts', async (args, hre) => {
    const accounts = await hre.ethers.getSigners()

    log.info('List of available Accounts')
    for (const account of accounts) {
        log.info('%s', account.address)
    }
})

// task action function receives the Hardhat Runtime Environment as second argument
task('blockNumber', 'Prints the current block number', async (_, {ethers}) => {
    await ethers.provider.getBlockNumber().then((blockNumber) => {
        log.info('Current block number: %d', blockNumber)
    })
})

task('createDao', 'Creates a DAO')
    .addParam('mediator', 'The Mediator contract address')
    .addParam('treasury', 'The Treasury address')
    .setAction(
        async (taskArgs: {mediator: string; treasury: string}, {ethers}) => {
            await createDao(taskArgs.mediator, taskArgs.treasury, ethers)
        }
    )

task('createBond', 'Creates a Performance Bond')
    .addParam('mediator', 'The Mediator contract address')
    .addParam('dao', 'The ID of the DAO to create the Bond in')
    .setAction(async (taskArgs: {mediator: string; dao: string}, {ethers}) => {
        await createBond(taskArgs.mediator, taskArgs.dao, ethers)
    })

/*
 * You need to export an object to set up your config
 * Go to https://hardhat.org/config/ to learn more
 *
 * At time of authoring 0.8.4 was the latest version supported by Hardhat
 */
export default {
    networks: {
        hardhat: {
            chainId: 33133,
            allowUnlimitedContractSize: false,
            loggingEnabled: false
        },
        local: {
            url: 'http://localhost:8545',
            chainId: 33133,
            allowUnlimitedContractSize: false,
            loggingEnabled: true
        }
    },
    solidity: {
        compilers: [
            {
                version: '0.7.6',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            },
            {
                version: '0.8.4',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }
        ]
    },
    etherscan: {
        apiKey: ''
    }
}
