import hardhatToolboxViem from '@nomicfoundation/hardhat-toolbox-viem'
import type { HardhatUserConfig } from 'hardhat/config'
import { loadEnvFile } from 'node:process'

try { loadEnvFile('.env') } catch { /* Environment may be provided by the shell or CI. */ }

const privateKey = process.env.DEPLOYER_PRIVATE_KEY

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViem],
  chainDescriptors: {
    968: {
      name: 'BOT Chain Testnet',
      chainType: 'generic',
      blockExplorers: {
        blockscout: {
          name: 'BOT Scan',
          url: 'https://scan.bohr.life',
          apiUrl: 'https://scan.bohr.life/api',
        },
      },
    },
  },
  verify: {
    blockscout: {
      apiKey: process.env.BLOCKSCOUT_API_KEY,
    },
  },
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    botchainTestnet: {
      type: 'http',
      url: process.env.BOTCHAIN_TESTNET_RPC_URL || 'https://rpc.bohr.life',
      chainId: 968,
      accounts: privateKey ? [privateKey] : [],
    },
  },
}

export default config
