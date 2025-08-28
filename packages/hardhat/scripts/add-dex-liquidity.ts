import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Load deployment configuration
const configPath = path.join(__dirname, "..", "config.json");
const deploymentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

async function main() {
  console.log("🚀 Adding liquidity to existing DEX...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Using deployer:", deployer.address);
  
  // Get deployed contract addresses (update these with your actual addresses)
  const dexAddress = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";
  const oracleTokenAddress = "0xc5a5C42992dECbae36851359345FE25997F5C42d";
  
  // Get contract instances
  const dex = await ethers.getContractAt("DEX", dexAddress);
  const oracleToken = await ethers.getContractAt("OracleToken", oracleTokenAddress);
  
  console.log("📋 Contract addresses:");
  console.log(`   DEX: ${dexAddress}`);
  console.log(`   OracleToken: ${oracleTokenAddress}`);
  
  // Check current reserves
  try {
    const tTrustReserve = await dex.tTrustReserve();
    const oracleReserve = await dex.oracleReserve();
    console.log("📊 Current DEX reserves:");
    console.log(`   TTRUST: ${ethers.formatEther(tTrustReserve)} TTRUST`);
    console.log(`   ORACLE: ${ethers.formatEther(oracleReserve)} ORACLE`);
    
    if (tTrustReserve > 0 && oracleReserve > 0) {
      console.log("✅ DEX already has liquidity!");
      return;
    }
  } catch (error) {
    console.log("⚠️  Could not check current reserves, proceeding with liquidity addition...");
  }
  
  // Check deployer balances
  const deployerEthBalance = await ethers.provider.getBalance(deployer.address);
  const deployerOracleBalance = await oracleToken.balanceOf(deployer.address);
  
  console.log("💰 Deployer balances:");
  console.log(`   TTRUST: ${ethers.formatEther(deployerEthBalance)} TTRUST`);
  console.log(`   ORACLE: ${ethers.formatEther(deployerOracleBalance)} ORACLE`);
  
  // Get liquidity amounts from config
  const ethForLiquidity = ethers.parseEther(deploymentConfig.distribution.dexLiquidity.ttrust);
  const oracleForLiquidity = ethers.parseEther(deploymentConfig.distribution.dexLiquidity.oracle);
  
  console.log("💱 Adding liquidity:");
  console.log(`   ${deploymentConfig.distribution.dexLiquidity.ttrust} TTRUST + ${deploymentConfig.distribution.dexLiquidity.oracle} ORACLE`);
  console.log(`   ${deploymentConfig.distribution.dexLiquidity.description}`);
  
  // Check if deployer has enough tokens
  if (deployerEthBalance < ethForLiquidity) {
    throw new Error(`Insufficient TTRUST balance. Need ${ethers.formatEther(ethForLiquidity)}, have ${ethers.formatEther(deployerEthBalance)}`);
  }
  
  if (deployerOracleBalance < oracleForLiquidity) {
    throw new Error(`Insufficient ORACLE balance. Need ${ethers.formatEther(oracleForLiquidity)}, have ${ethers.formatEther(deployerOracleBalance)}`);
  }
  
  try {
    // Step 1: Approve DEX to spend ORACLE tokens
    console.log("🔄 Approving DEX to spend ORACLE tokens...");
    const approveTx = await oracleToken.approve(dexAddress, oracleForLiquidity);
    await approveTx.wait();
    console.log("✅ Approval confirmed");
    
    // Step 2: Add liquidity (send TTRUST as msg.value)
    console.log("🔄 Adding liquidity to DEX...");
    const addLiquidityTx = await dex.addLiquidity(0, oracleForLiquidity, { 
      value: ethForLiquidity,
      gasLimit: 500000 // Set explicit gas limit
    });
    
    console.log("⏳ Transaction sent:", addLiquidityTx.hash);
    const receipt = await addLiquidityTx.wait();
    console.log("✅ Liquidity added! Gas used:", receipt.gasUsed.toString());
    
    // Check new reserves
    const newTTrustReserve = await dex.tTrustReserve();
    const newOracleReserve = await dex.oracleReserve();
    
    console.log("📊 New DEX reserves:");
    console.log(`   TTRUST: ${ethers.formatEther(newTTrustReserve)} TTRUST`);
    console.log(`   ORACLE: ${ethers.formatEther(newOracleReserve)} ORACLE`);
    
    // Calculate and display the price
    if (newTTrustReserve > 0 && newOracleReserve > 0) {
      const price = (newOracleReserve * ethers.parseEther("1")) / newTTrustReserve;
      console.log(`💰 Initial price: 1 TTRUST = ${ethers.formatEther(price)} ORACLE`);
    }
    
    console.log("🎉 DEX liquidity setup complete!");
    
  } catch (error) {
    console.error("❌ Error adding liquidity:", error);
    throw error;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
