import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Load deployment configuration
const configPath = path.join(__dirname, "..", "config.json");
const deploymentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

async function main() {
  console.log("🔍 Debugging DEX liquidity issue...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  
  // Contract addresses from the deployment log
  const oracleTokenAddress = "0xF840731096FAeD511eFda466ACaD39531101fBAc";
  const dexAddress = "0x072c2b3f3937aD47Da25dE0de1e36E4C366d5FED";
  const oracleLendAddress = "0x5CdfBB614F07DA297fBfCb0Dcc9765463F2cCE9e";
  
  // Get contract instances
  const oracleToken = await ethers.getContractAt("OracleToken", oracleTokenAddress);
  const dex = await ethers.getContractAt("DEX", dexAddress);
  const oracleLend = await ethers.getContractAt("OracleLend", oracleLendAddress);
  
  console.log("📋 Contract addresses:");
  console.log(`   OracleToken: ${oracleTokenAddress}`);
  console.log(`   DEX: ${dexAddress}`);
  console.log(`   OracleLend: ${oracleLendAddress}`);
  
  // Check all balances
  const deployerEthBalance = await ethers.provider.getBalance(deployer.address);
  const deployerOracleBalance = await oracleToken.balanceOf(deployer.address);
  const dexOracleBalance = await oracleToken.balanceOf(dexAddress);
  const oracleLendBalance = await oracleLend.getContractOracleBalance();
  const totalSupply = await oracleToken.totalSupply();
  
  console.log("💰 Current balances:");
  console.log(`   Deployer TTRUST: ${ethers.formatEther(deployerEthBalance)} TTRUST`);
  console.log(`   Deployer ORACLE: ${ethers.formatEther(deployerOracleBalance)} ORACLE`);
  console.log(`   DEX ORACLE: ${ethers.formatEther(dexOracleBalance)} ORACLE`);
  console.log(`   OracleLend ORACLE: ${ethers.formatEther(oracleLendBalance)} ORACLE`);
  console.log(`   Total ORACLE Supply: ${ethers.formatEther(totalSupply)} ORACLE`);
  
  // Check DEX reserves
  try {
    const tTrustReserve = await dex.tTrustReserve();
    const oracleReserve = await dex.oracleReserve();
    console.log("📊 Current DEX reserves:");
    console.log(`   TTRUST Reserve: ${ethers.formatEther(tTrustReserve)} TTRUST`);
    console.log(`   ORACLE Reserve: ${ethers.formatEther(oracleReserve)} ORACLE`);
  } catch (error) {
    console.log("❌ Error checking DEX reserves:", error.message);
  }
  
  // Check what we need for liquidity
  const ethForLiquidity = ethers.parseEther(deploymentConfig.distribution.dexLiquidity.ttrust);
  const oracleForLiquidity = ethers.parseEther(deploymentConfig.distribution.dexLiquidity.oracle);
  
  console.log("🎯 Required for liquidity:");
  console.log(`   Need TTRUST: ${ethers.formatEther(ethForLiquidity)} TTRUST`);
  console.log(`   Need ORACLE: ${ethers.formatEther(oracleForLiquidity)} ORACLE`);
  
  // Check if we have enough
  console.log("✅ Availability check:");
  console.log(`   TTRUST sufficient: ${deployerEthBalance >= ethForLiquidity ? "YES" : "NO"}`);
  console.log(`   ORACLE sufficient: ${deployerOracleBalance >= oracleForLiquidity ? "YES" : "NO"}`);
  
  if (deployerOracleBalance < oracleForLiquidity) {
    const shortage = oracleForLiquidity - deployerOracleBalance;
    console.log(`   ORACLE shortage: ${ethers.formatEther(shortage)} ORACLE`);
  }
  
  // Check DEX contract details
  try {
    const tTrustToken = await dex.tTRUST();
    const oracleTokenInDex = await dex.ORACLE();
    console.log("📋 DEX token addresses:");
    console.log(`   tTRUST in DEX: ${tTrustToken}`);
    console.log(`   ORACLE in DEX: ${oracleTokenInDex}`);
    console.log(`   Expected ORACLE: ${oracleTokenAddress}`);
    console.log(`   ORACLE match: ${oracleTokenInDex.toLowerCase() === oracleTokenAddress.toLowerCase() ? "YES" : "NO"}`);
  } catch (error) {
    console.log("❌ Error checking DEX token addresses:", error.message);
  }
  
  // Try to simulate the addLiquidity call
  console.log("🧪 Simulating addLiquidity call...");
  try {
    // First check allowance
    const allowance = await oracleToken.allowance(deployer.address, dexAddress);
    console.log(`   Current allowance: ${ethers.formatEther(allowance)} ORACLE`);
    
    if (allowance < oracleForLiquidity) {
      console.log("   ⚠️ Need to approve first");
    } else {
      console.log("   ✅ Allowance sufficient");
    }
    
    // Try to estimate gas for the addLiquidity call
    const gasEstimate = await dex.addLiquidity.estimateGas(0, oracleForLiquidity, { value: ethForLiquidity });
    console.log(`   ✅ Gas estimate successful: ${gasEstimate.toString()}`);
    
  } catch (error) {
    console.log("   ❌ Gas estimation failed:", error.message);
    
    // If it's a revert, try to get more details
    if (error.message.includes("execution reverted")) {
      console.log("   🔍 This suggests a contract-level revert");
      console.log("   Possible causes:");
      console.log("   - Insufficient allowance");
      console.log("   - DEX contract logic issue");
      console.log("   - Token address mismatch");
      console.log("   - Already has liquidity");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
