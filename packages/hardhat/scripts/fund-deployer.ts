import { ethers } from "hardhat";

async function main() {
  console.log("💰 Funding deployer account...");

  // The current deployer that needs funding
  const deployerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  // The funded account (you'll need to provide the private key)
  const FUNDED_PRIVATE_KEY = process.env.FUNDED_PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE";
  
  if (FUNDED_PRIVATE_KEY === "YOUR_PRIVATE_KEY_HERE") {
    console.error("❌ Please set FUNDED_PRIVATE_KEY environment variable");
    console.log("Run the revealPK.ts script to get your private key, then:");
    console.log("export FUNDED_PRIVATE_KEY='your_private_key_here'");
    console.log("npx hardhat run scripts/fund-deployer.ts --network intuition");
    return;
  }
  
  // Create provider and signer for funded account
  const provider = new ethers.JsonRpcProvider("https://testnet.rpc.intuition.systems");
  const fundedSigner = new ethers.Wallet(FUNDED_PRIVATE_KEY, provider);
  
  console.log("Funded account:", fundedSigner.address);
  console.log("Deployer account:", deployerAddress);
  
  // Check balances
  const fundedBalance = await provider.getBalance(fundedSigner.address);
  const deployerBalance = await provider.getBalance(deployerAddress);
  
  console.log(`Funded account balance: ${ethers.formatEther(fundedBalance)} TTRUST`);
  console.log(`Deployer account balance: ${ethers.formatEther(deployerBalance)} TTRUST`);
  
  // Transfer 15 TTRUST to deployer (10 for liquidity + 5 for gas)
  const amountToTransfer = ethers.parseEther("15");
  
  if (fundedBalance < amountToTransfer) {
    console.error("❌ Funded account doesn't have enough TTRUST");
    return;
  }
  
  console.log(`\nTransferring ${ethers.formatEther(amountToTransfer)} TTRUST to deployer...`);
  
  const tx = await fundedSigner.sendTransaction({
    to: deployerAddress,
    value: amountToTransfer,
    gasLimit: 21000
  });
  
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  
  // Check new balances
  const newDeployerBalance = await provider.getBalance(deployerAddress);
  console.log(`✅ Transfer complete! Deployer now has: ${ethers.formatEther(newDeployerBalance)} TTRUST`);
  console.log("");
  console.log("Now you can run the deployment:");
  console.log("npx hardhat deploy --network intuition --reset");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
