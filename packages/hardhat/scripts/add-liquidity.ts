import { ethers } from "hardhat";

async function main() {
  console.log("Adding more liquidity to DEX...");

  // Get the deployed contract addresses
  const dexAddress = "0xC1DAC5d56c93c5c23CAc4D59195708C894C7090B";
  const oracleTokenAddress = "0x948a005aD67d1C8C2c7f2dF4689bfe777604F45b";

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Get contract instances
  const oracleToken = await ethers.getContractAt("OracleToken", oracleTokenAddress);
  const dex = await ethers.getContractAt("DEX", dexAddress);

  // Check current DEX stats
  const stats = await dex.getDEXStats();
  console.log("Current DEX stats:");
  console.log(`  TTRUST Reserve: ${ethers.formatEther(stats[0])} TTRUST`);
  console.log(`  ORACLE Reserve: ${ethers.formatEther(stats[1])} ORACLE`);

  // Add more liquidity: 0.03 TTRUST + 3 ORACLE tokens (within available balance)
  const additionalTtrust = ethers.parseEther("0.03"); // 0.03 TTRUST
  const additionalOracle = ethers.parseEther("3"); // 3 ORACLE (0.03 * 100 exchange rate)

  console.log(`\nAdding liquidity: ${ethers.formatEther(additionalTtrust)} TTRUST + ${ethers.formatEther(additionalOracle)} ORACLE`);

  // Approve DEX to spend ORACLE tokens
  console.log("Approving ORACLE tokens...");
  const approveTx = await oracleToken.approve(dexAddress, additionalOracle);
  await approveTx.wait();
  console.log("✅ ORACLE tokens approved");

  // Add liquidity
  console.log("Adding liquidity...");
  const addLiquidityTx = await dex.addLiquidity(0, additionalOracle, { 
    value: additionalTtrust,
    gasLimit: 300000 
  });
  await addLiquidityTx.wait();
  console.log("✅ Liquidity added successfully");

  // Check new DEX stats
  const newStats = await dex.getDEXStats();
  console.log("\nNew DEX stats:");
  console.log(`  TTRUST Reserve: ${ethers.formatEther(newStats[0])} TTRUST`);
  console.log(`  ORACLE Reserve: ${ethers.formatEther(newStats[1])} ORACLE`);
  
  console.log("\n🎉 DEX now has sufficient liquidity for larger swaps!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
