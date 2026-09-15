# BountyHub

**Communities fund what gets built.** BountyHub is a community funding board built for BOT Chain Testnet. Creators publish development bounties, community members pool native BOT, builders submit work, wallets vote, and the winning builder claims the escrowed reward.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The polished preview works without a deployed contract by showing demo data. Wallet transactions become available after `VITE_BOUNTYHUB_ADDRESS` is set to a deployed address.

## Smart contract lifecycle

1. `createBounty` opens funding and voting and can include seed BOT.
2. `fundBounty` pools native BOT in escrow.
3. `submitWork` records a public proof URL or IPFS URI.
4. `vote` allows one vote per wallet for each bounty.
5. `selectWinner` finalizes the highest-voted submission after the deadline.
6. `claimReward` pays the full pool to that submission's builder.
7. If no work was submitted, `cancelEmptyBounty` enables funder refunds.

## Deploy to BOT Chain Testnet

BOT Chain Testnet uses chain ID `968`, native token `BOT`, RPC `https://rpc.bohr.life`, and explorer `https://scan.bohr.life`.

```bash
npm run contract:compile
npm run contract:test
npm run contract:deploy:testnet
```

Set `DEPLOYER_PRIVATE_KEY` in `.env` before deploying. The wallet needs test BOT from [the faucet](https://faucet.botchain.ai). Copy the printed contract address into `VITE_BOUNTYHUB_ADDRESS`, restart the frontend, and rebuild.

Never commit `.env` or a private key. The contract should receive an independent security review before handling assets with real value.
