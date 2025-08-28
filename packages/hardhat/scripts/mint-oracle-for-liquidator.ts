import { ethers } from "hardhat";

async function main() {
  console.log("🏭 Minting ORACLE tokens for liquidator...");
  
  // Your liquidator address (you are the owner/minter)
  const liquidatorAddress = "0xAD50D6A764F10D531A759cc4b651FE3A96c7D03B";
  
  // Contract address
  const oracleTokenAddress = "0xF840731096FAeD511eFda466ACaD39531101fBAc";
  
  // Get contract instance (you need to connect with your liquidator account)
  const oracleToken = await ethers.getContractAt("OracleToken", oracleTokenAddress);
  
  console.log("📋 Contract address:", oracleTokenAddress);
  console.log("👤 Liquidator address:", liquidatorAddress);
  
  // Check current balance
  const currentBalance = await oracleToken.balanceOf(liquidatorAddress);
  console.log(`💰 Current balance: ${ethers.formatEther(currentBalance)} ORACLE`);
  
  // Amount to mint for liquidations (100K should be plenty)
  const mintAmount = ethers.parseEther("100000"); // 100K ORACLE
  
  console.log(`🎯 Minting: ${ethers.formatEther(mintAmount)} ORACLE`);
  
  try {
    // Note: This script needs to be run with the liquidator's private key
    console.log("⚠️  NOTE: This script should be run with the liquidator's account");
    console.log("⚠️  You need to import your liquidator private key to run this");
    
    // For now, just show the command you need to run
    console.log("\n💡 To mint ORACLE tokens, run this from your liquidator account:");
    console.log("1. Import your liquidator private key to hardhat");
    console.log("2. Or use the frontend to call the mint function");
    console.log("3. Or use a wallet interface to call mint() on the OracleToken contract");
    
    console.log("\n🔧 Contract call needed:");
    console.log(`   Contract: ${oracleTokenAddress}`);
    console.log(`   Function: mint(address to, uint256 amount)`);
    console.log(`   Parameters:`);
    console.log(`     to: ${liquidatorAddress}`);
    console.log(`     amount: ${mintAmount.toString()} (${ethers.formatEther(mintAmount)} ORACLE)`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
