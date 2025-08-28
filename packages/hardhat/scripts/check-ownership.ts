import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking contract ownership and permissions...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  
  // Your liquidator address
  const liquidatorAddress = "0xAD50D6A764F10D531A759cc4b651FE3A96c7D03B";
  
  // Contract addresses
  const oracleTokenAddress = "0xF840731096FAeD511eFda466ACaD39531101fBAc";
  const oracleLendAddress = "0x5CdfBB614F07DA297fBfCb0Dcc9765463F2cCE9e";
  
  // Get contract instances
  const oracleToken = await ethers.getContractAt("OracleToken", oracleTokenAddress);
  const oracleLend = await ethers.getContractAt("OracleLend", oracleLendAddress);
  
  console.log("🔑 Contract ownership:");
  
  try {
    const oracleTokenOwner = await oracleToken.owner();
    console.log(`   OracleToken owner: ${oracleTokenOwner}`);
    console.log(`   Is deployer owner: ${oracleTokenOwner.toLowerCase() === deployer.address.toLowerCase()}`);
  } catch (error) {
    console.log("   OracleToken owner: Could not check");
  }
  
  try {
    const oracleLendOwner = await oracleLend.owner();
    console.log(`   OracleLend owner: ${oracleLendOwner}`);
    console.log(`   Is deployer owner: ${oracleLendOwner.toLowerCase() === deployer.address.toLowerCase()}`);
  } catch (error) {
    console.log("   OracleLend owner: Could not check");
  }
  
  console.log("🏭 Minting permissions:");
  
  try {
    const deployerIsMinter = await oracleToken.isMinter(deployer.address);
    const liquidatorIsMinter = await oracleToken.isMinter(liquidatorAddress);
    console.log(`   Deployer is minter: ${deployerIsMinter}`);
    console.log(`   Liquidator is minter: ${liquidatorIsMinter}`);
  } catch (error) {
    console.log("   Could not check minter status");
  }
  
  console.log("💰 Token balances:");
  
  const deployerBalance = await oracleToken.balanceOf(deployer.address);
  const liquidatorBalance = await oracleToken.balanceOf(liquidatorAddress);
  const oracleLendBalance = await oracleLend.getContractOracleBalance();
  const totalSupply = await oracleToken.totalSupply();
  
  console.log(`   Deployer: ${ethers.formatEther(deployerBalance)} ORACLE`);
  console.log(`   Liquidator: ${ethers.formatEther(liquidatorBalance)} ORACLE`);
  console.log(`   OracleLend: ${ethers.formatEther(oracleLendBalance)} ORACLE`);
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} ORACLE`);
  
  // Check if there are any other addresses with ORACLE tokens
  console.log("🔍 Looking for ORACLE tokens in other addresses...");
  
  const unaccounted = totalSupply - deployerBalance - oracleLendBalance - liquidatorBalance;
  console.log(`   Unaccounted tokens: ${ethers.formatEther(unaccounted)} ORACLE`);
  
  if (unaccounted > 0) {
    console.log("   💡 There are ORACLE tokens in other addresses");
    
    // Check DEX balance
    const dexAddress = "0x072c2b3f3937aD47Da25dE0de1e36E4C366d5FED";
    const dexBalance = await oracleToken.balanceOf(dexAddress);
    console.log(`   DEX balance: ${ethers.formatEther(dexBalance)} ORACLE`);
    
    // Check if DEX has the missing tokens
    if (dexBalance > 0) {
      console.log("   ✅ Found ORACLE tokens in DEX!");
      console.log("   💡 You can get ORACLE tokens by swapping TTRUST for ORACLE on the DEX");
    }
  }
  
  console.log("\n💡 Solutions for getting ORACLE tokens:");
  console.log("1. 🔄 Swap TTRUST for ORACLE tokens using the DEX");
  console.log("2. 💰 Borrow ORACLE tokens using ETH as collateral");
  console.log("3. 🎁 Ask someone with ORACLE tokens to transfer some to you");
  console.log("4. 🔧 If you're the owner, use emergency functions");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
