import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Finding ORACLE tokens for DEX liquidity...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  
  // Contract addresses
  const oracleTokenAddress = "0xF840731096FAeD511eFda466ACaD39531101fBAc";
  const oracleLendAddress = "0x5CdfBB614F07DA297fBfCb0Dcc9765463F2cCE9e";
  const dexAddress = "0x072c2b3f3937aD47Da25dE0de1e36E4C366d5FED";
  
  // Get contract instances
  const oracleToken = await ethers.getContractAt("OracleToken", oracleTokenAddress);
  const oracleLend = await ethers.getContractAt("OracleLend", oracleLendAddress);
  const dex = await ethers.getContractAt("DEX", dexAddress);
  
  // Check all balances
  const deployerBalance = await oracleToken.balanceOf(deployer.address);
  const oracleLendBalance = await oracleLend.getContractOracleBalance();
  const dexBalance = await oracleToken.balanceOf(dexAddress);
  const totalSupply = await oracleToken.totalSupply();
  
  console.log("💰 Current ORACLE token distribution:");
  console.log(`   Deployer: ${ethers.formatEther(deployerBalance)} ORACLE`);
  console.log(`   OracleLend: ${ethers.formatEther(oracleLendBalance)} ORACLE`);
  console.log(`   DEX: ${ethers.formatEther(dexBalance)} ORACLE`);
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} ORACLE`);
  
  const accounted = deployerBalance + oracleLendBalance + dexBalance;
  const missing = totalSupply - accounted;
  console.log(`   Unaccounted: ${ethers.formatEther(missing)} ORACLE`);
  
  // Check if DEX already has liquidity
  try {
    const tTrustReserve = await dex.tTrustReserve();
    const oracleReserve = await dex.oracleReserve();
    console.log("📊 Current DEX reserves:");
    console.log(`   TTRUST: ${ethers.formatEther(tTrustReserve)} TTRUST`);
    console.log(`   ORACLE: ${ethers.formatEther(oracleReserve)} ORACLE`);
    
    if (tTrustReserve > 0 && oracleReserve > 0) {
      console.log("✅ DEX already has liquidity!");
      const price = (oracleReserve * ethers.parseEther("1")) / tTrustReserve;
      console.log(`💰 Current price: 1 TTRUST = ${ethers.formatEther(price)} ORACLE`);
      
      console.log("🎉 Problem solved! The frontend should work now.");
      return;
    }
  } catch (error) {
    console.log("⚠️ Could not check DEX reserves");
  }
  
  // Try to get the owner of OracleLend to see if we can withdraw
  try {
    const owner = await oracleLend.owner();
    console.log(`🔑 OracleLend owner: ${owner}`);
    console.log(`   Is deployer owner: ${owner.toLowerCase() === deployer.address.toLowerCase()}`);
    
    if (owner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("✅ Deployer is owner, can use emergencyWithdrawOracle");
      
      // Try a smaller withdrawal
      const smallAmount = ethers.parseEther("10000"); // 10K ORACLE
      console.log(`🔄 Trying to withdraw ${ethers.formatEther(smallAmount)} ORACLE...`);
      
      const withdrawTx = await oracleLend.emergencyWithdrawOracle(smallAmount);
      await withdrawTx.wait();
      console.log("✅ Emergency withdrawal successful!");
      
      // Now add liquidity
      await addLiquidity(dex, oracleToken, dexAddress);
      return;
    }
  } catch (error) {
    console.log("❌ Could not check owner or withdraw:", error.message);
  }
  
  // Alternative: Try to mint new tokens if deployer is a minter
  try {
    console.log("🔄 Checking if deployer can mint ORACLE tokens...");
    const isMinter = await oracleToken.isMinter(deployer.address);
    console.log(`   Is deployer a minter: ${isMinter}`);
    
    if (isMinter) {
      const mintAmount = ethers.parseEther("10000"); // 10K ORACLE
      console.log(`🔄 Minting ${ethers.formatEther(mintAmount)} ORACLE tokens...`);
      
      const mintTx = await oracleToken.mint(deployer.address, mintAmount);
      await mintTx.wait();
      console.log("✅ Minting successful!");
      
      // Now add liquidity
      await addLiquidity(dex, oracleToken, dexAddress);
      return;
    }
  } catch (error) {
    console.log("❌ Could not mint tokens:", error.message);
  }
  
  // Last resort: Check if there are any ORACLE tokens in other addresses
  console.log("🔍 Looking for ORACLE tokens in other common addresses...");
  
  // Check some common addresses where tokens might be
  const addressesToCheck = [
    deployer.address,
    oracleTokenAddress, // Token contract itself
    "0x0000000000000000000000000000000000000000", // Zero address (burned)
  ];
  
  for (const addr of addressesToCheck) {
    try {
      const balance = await oracleToken.balanceOf(addr);
      if (balance > 0) {
        console.log(`   ${addr}: ${ethers.formatEther(balance)} ORACLE`);
      }
    } catch (error) {
      // Skip
    }
  }
  
  console.log("\n💡 Possible solutions:");
  console.log("1. Transfer ownership of OracleLend to the deployer");
  console.log("2. Add the deployer as a minter for OracleToken");
  console.log("3. Transfer some ORACLE tokens from another address");
  console.log("4. Deploy new contracts with proper token distribution");
  
  throw new Error("Could not find a way to get ORACLE tokens for DEX liquidity");
}

async function addLiquidity(dex: any, oracleToken: any, dexAddress: string) {
  console.log("🔄 Adding liquidity to DEX...");
  
  const ethAmount = ethers.parseEther("0.01"); // 0.01 TTRUST
  const oracleAmount = ethers.parseEther("5000"); // 5K ORACLE
  
  // Approve DEX to spend ORACLE tokens
  console.log("🔄 Approving DEX to spend ORACLE tokens...");
  const approveTx = await oracleToken.approve(dexAddress, oracleAmount);
  await approveTx.wait();
  console.log("✅ Approval confirmed");
  
  // Add liquidity
  console.log(`🔄 Adding ${ethers.formatEther(ethAmount)} TTRUST + ${ethers.formatEther(oracleAmount)} ORACLE...`);
  const addLiquidityTx = await dex.addLiquidity(0, oracleAmount, { 
    value: ethAmount,
    gasLimit: 1000000
  });
  
  console.log("⏳ Transaction sent:", addLiquidityTx.hash);
  const receipt = await addLiquidityTx.wait();
  console.log("✅ Liquidity added! Gas used:", receipt.gasUsed.toString());
  
  // Check final reserves
  const tTrustReserve = await dex.tTrustReserve();
  const oracleReserve = await dex.oracleReserve();
  
  console.log("📊 Final DEX reserves:");
  console.log(`   TTRUST: ${ethers.formatEther(tTrustReserve)} TTRUST`);
  console.log(`   ORACLE: ${ethers.formatEther(oracleReserve)} ORACLE`);
  
  const price = (oracleReserve * ethers.parseEther("1")) / tTrustReserve;
  console.log(`💰 Price: 1 TTRUST = ${ethers.formatEther(price)} ORACLE`);
  
  console.log("🎉 DEX liquidity setup complete!");
  console.log("🔄 The frontend should now work without 'missing revert data' errors");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
