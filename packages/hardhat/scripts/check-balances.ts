import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking deployer balances...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  
  // Get deployed contract addresses
  const oracleTokenAddress = "0xF840731096FAeD511eFda466ACaD39531101fBAc";
  const oracleLendAddress = "0x5CdfBB614F07DA297fBfCb0Dcc9765463F2cCE9e";
  
  // Get contract instances
  const oracleToken = await ethers.getContractAt("OracleToken", oracleTokenAddress);
  
  // Check balances
  const deployerEthBalance = await ethers.provider.getBalance(deployer.address);
  const deployerOracleBalance = await oracleToken.balanceOf(deployer.address);
  const oracleLendBalance = await oracleToken.balanceOf(oracleLendAddress);
  const totalSupply = await oracleToken.totalSupply();
  
  console.log("💰 Balances:");
  console.log(`   Deployer TTRUST: ${ethers.formatEther(deployerEthBalance)} TTRUST`);
  console.log(`   Deployer ORACLE: ${ethers.formatEther(deployerOracleBalance)} ORACLE`);
  console.log(`   OracleLend ORACLE: ${ethers.formatEther(oracleLendBalance)} ORACLE`);
  console.log(`   Total ORACLE Supply: ${ethers.formatEther(totalSupply)} ORACLE`);
  
  // Check if deployer has enough for funding (1M ORACLE from config)
  const requiredAmount = ethers.parseEther("1000000"); // 1M ORACLE
  console.log(`\n📋 Funding requirement: ${ethers.formatEther(requiredAmount)} ORACLE`);
  
  if (deployerOracleBalance >= requiredAmount) {
    console.log("✅ Deployer has enough ORACLE tokens for funding");
  } else {
    console.log("❌ Deployer does NOT have enough ORACLE tokens for funding");
    console.log(`   Need: ${ethers.formatEther(requiredAmount)} ORACLE`);
    console.log(`   Have: ${ethers.formatEther(deployerOracleBalance)} ORACLE`);
    console.log(`   Missing: ${ethers.formatEther(requiredAmount - deployerOracleBalance)} ORACLE`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
