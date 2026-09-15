import { defineChain } from 'viem'

export const botChainTestnet = defineChain({
  id: 968,
  name: 'BOT Chain Testnet',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.bohr.life'] } },
  blockExplorers: { default: { name: 'BOT Scan', url: 'https://scan.bohr.life' } },
  testnet: true,
})

export const contractAddress = (import.meta.env.VITE_BOUNTYHUB_ADDRESS ||
  '0x6d06bafdd04e68648b85ce15635f30e83405e831') as `0x${string}`

export const isContractConfigured = !/^0x0{40}$/i.test(contractAddress)

export const bountyHubAbi = [
  {
    type: 'function', name: 'createBounty', stateMutability: 'payable',
    inputs: [
      { name: 'title', type: 'string' }, { name: 'description', type: 'string' },
      { name: 'category', type: 'string' }, { name: 'target', type: 'uint128' },
      { name: 'deadline', type: 'uint64' },
    ], outputs: [{ name: 'bountyId', type: 'uint256' }],
  },
  {
    type: 'function', name: 'fundBounty', stateMutability: 'payable',
    inputs: [{ name: 'bountyId', type: 'uint256' }], outputs: [],
  },
  {
    type: 'function', name: 'vote', stateMutability: 'nonpayable',
    inputs: [{ name: 'bountyId', type: 'uint256' }, { name: 'submissionId', type: 'uint256' }], outputs: [],
  },
  {
    type: 'function', name: 'submitWork', stateMutability: 'nonpayable',
    inputs: [{ name: 'bountyId', type: 'uint256' }, { name: 'proofURI', type: 'string' }],
    outputs: [{ name: 'submissionId', type: 'uint256' }],
  },
  {
    type: 'function', name: 'selectWinner', stateMutability: 'nonpayable',
    inputs: [{ name: 'bountyId', type: 'uint256' }], outputs: [],
  },
  {
    type: 'function', name: 'claimReward', stateMutability: 'nonpayable',
    inputs: [{ name: 'bountyId', type: 'uint256' }], outputs: [],
  },
  {
    type: 'function', name: 'bountyCount', stateMutability: 'view', inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'bounties', stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address' }, { name: 'title', type: 'string' },
      { name: 'description', type: 'string' }, { name: 'category', type: 'string' },
      { name: 'deadline', type: 'uint64' }, { name: 'target', type: 'uint128' },
      { name: 'raised', type: 'uint128' }, { name: 'submissionCount', type: 'uint32' },
      { name: 'totalVotes', type: 'uint32' }, { name: 'winnerId', type: 'uint32' },
      { name: 'status', type: 'uint8' },
    ],
  },
] as const
