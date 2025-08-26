import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Oracle Lend contracts with funded account...");

  // This should be the account with 100+ TTRUST
  // You'll need to update this with the actual private key from revealPK.ts
  const FUNDED_PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE"; // Replace with actual private key
  
  // Create provider and signer
  const provider = new ethers.JsonRpcProvider("https://testnet.rpc.intuition.systems");
  const signer = new ethers.Wallet(FUNDED_PRIVATE_KEY, provider);
  
  console.log("Using account:", signer.address);
  
  // Check balance
  const balance = await provider.getBalance(signer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} TTRUST`);
  
  if (balance < ethers.parseEther("10")) {
    console.error("❌ Account needs at least 10 TTRUST for deployment");
    return;
  }

  console.log("✅ Account has sufficient balance for deployment");
  console.log("");
  console.log("Please update the hardhat.config.ts with this private key:");
  console.log(`deployerPrivateKey = "${FUNDED_PRIVATE_KEY}";`);
  console.log("");
  console.log("Then run: npx hardhat deploy --network intuition --reset");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
