import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { network } from 'hardhat'
import { parseEther } from 'viem'

describe('BountyHub', async () => {
  const { viem } = await network.connect()

  it('funds, votes, selects a winner, and pays the reward', async () => {
    const [creator, funder, builder, voter] = await viem.getWalletClients()
    const hub = await viem.deployContract('BountyHub')
    const publicClient = await viem.getPublicClient()
    const now = Number((await publicClient.getBlock()).timestamp)

    await hub.write.createBounty(
      ['Open source SDK', 'Ship a typed SDK', 'Developer tools', parseEther('10'), BigInt(now + 7200)],
      { account: creator.account, value: parseEther('1') },
    )
    await hub.write.fundBounty([1n], { account: funder.account, value: parseEther('4') })
    await hub.write.submitWork([1n, 'ipfs://proof'], { account: builder.account })
    await hub.write.vote([1n, 1n], { account: voter.account })

    const testClient = await viem.getTestClient()
    await testClient.increaseTime({ seconds: 7201 })
    await testClient.mine({ blocks: 1 })
    await hub.write.selectWinner([1n])
    await hub.write.claimReward([1n], { account: builder.account })

    const bounty = await hub.read.bounties([1n])
    assert.equal(bounty[6], 0n)
    assert.equal(bounty[10], 2)
    assert.equal(await hub.read.totalEarned([builder.account.address]), parseEther('5'))
  })

  it('prevents a wallet from voting twice', async () => {
    const [creator, builder, voter] = await viem.getWalletClients()
    const hub = await viem.deployContract('BountyHub')
    const publicClient = await viem.getPublicClient()
    const deadline = (await publicClient.getBlock()).timestamp + 7200n
    await hub.write.createBounty(['UI kit', 'Build it', 'Design', parseEther('1'), deadline], { account: creator.account })
    await hub.write.submitWork([1n, 'https://github.com/example/work'], { account: builder.account })
    await hub.write.vote([1n, 1n], { account: voter.account })
    await assert.rejects(() => hub.write.vote([1n, 1n], { account: voter.account }))
  })
})
