import hre from 'hardhat'

async function main() {
  const client = await hre.viem.getPublicClient()
  const contract = await hre.viem.deployContract('BountyHub')
  console.log(`BountyHub deployed to: ${contract.address}`)
  console.log(`Explorer: https://scan.bohr.life/address/${contract.address}`)
  console.log(`Transaction: ${contract.deploymentTransactionHash}`)
  await client.waitForTransactionReceipt({ hash: contract.deploymentTransactionHash! })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
