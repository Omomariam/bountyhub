import hre from 'hardhat'

async function main() {
  const { viem } = await hre.network.connect()
  const client = await viem.getPublicClient()
  const { contract, deploymentTransaction } = await viem.sendDeploymentTransaction('BountyHub')
  const receipt = await client.waitForTransactionReceipt({ hash: deploymentTransaction.hash })
  console.log(`BountyHub deployed to: ${contract.address}`)
  console.log(`Explorer: https://scan.bohr.life/address/${contract.address}`)
  console.log(`Transaction: ${deploymentTransaction.hash}`)
  console.log(`Block: ${receipt.blockNumber}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
