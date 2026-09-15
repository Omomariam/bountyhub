import hardhatToolboxViem from '@nomicfoundation/hardhat-toolbox-viem'
import type { HardhatUserConfig } from 'hardhat/config'

const privateKey = process.env.DEPLOYER_PRIVATE_KEY

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViem],
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
