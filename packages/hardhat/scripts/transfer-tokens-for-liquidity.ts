import { ethers } from "hardhat";

async function main() {
  console.log("🔄 Transferring ORACLE tokens from OracleLend back to deployer for liquidity...");
  
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
  
  // Check current balances
  const deployerBalance = await oracleToken.balanceOf(deployer.address);
  const oracleLendBalance = await oracleLend.getContractOracleBalance();
  const totalSupply = await oracleToken.totalSupply();
  
  console.log("💰 Current ORACLE balances:");
  console.log(`   Deployer: ${ethers.formatEther(deployerBalance)} ORACLE`);
  console.log(`   OracleLend: ${ethers.formatEther(oracleLendBalance)} ORACLE`);
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} ORACLE`);
  
  // We need just a small amount for liquidity - 10K ORACLE should be enough
  const amountNeeded = ethers.parseEther("10000"); // 10K ORACLE
  
  if (deployerBalance >= amountNeeded) {
    console.log("✅ Deployer already has enough ORACLE tokens!");
    
    // Try to add liquidity directly
    await addLiquidity(dex, oracleToken, dexAddress, amountNeeded);
    return;
  }
  
  if (oracleLendBalance < amountNeeded) {
    throw new Error(`OracleLend doesn't have enough tokens. Has ${ethers.formatEther(oracleLendBalance)}, need ${ethers.formatEther(amountNeeded)}`);
  }
  
  console.log(`🔄 Withdrawing ${ethers.formatEther(amountNeeded)} ORACLE from OracleLend...`);
  
  try {
    // Use emergencyWithdrawOracle to get some tokens back for liquidity
    const withdrawTx = await oracleLend.emergencyWithdrawOracle(amountNeeded);
    await withdrawTx.wait();
    console.log("✅ Emergency withdrawal successful");
    
    // Check new balances
    const newDeployerBalance = await oracleToken.balanceOf(deployer.address);
    const newOracleLendBalance = await oracleLend.getContractOracleBalance();
    
    console.log("💰 New ORACLE balances:");
    console.log(`   Deployer: ${ethers.formatEther(newDeployerBalance)} ORACLE`);
    console.log(`   OracleLend: ${ethers.formatEther(newOracleLendBalance)} ORACLE`);
    
    // Now add liquidity
    await addLiquidity(dex, oracleToken, dexAddress, amountNeeded);
    
  } catch (error) {
    console.error("❌ Emergency withdrawal failed:", error.message);
    
    if (error.message.includes("Ownable: caller is not the owner")) {
      console.log("💡 Try transferring ownership first or use a different approach");
    }
    
    throw error;
  }
}

async function addLiquidity(dex: any, oracleToken: any, dexAddress: string, oracleAmount: any) {
  console.log("🔄 Adding liquidity to DEX...");
  
  const ethAmount = ethers.parseEther("0.01"); // 0.01 TTRUST
  const oracleForLiquidity = ethers.parseEther("5000"); // 5K ORACLE (half of what we withdrew)
  
  try {
    // Check if DEX already has liquidity
    const tTrustReserve = await dex.tTrustReserve();
    const oracleReserve = await dex.oracleReserve();
    
    if (tTrustReserve > 0 && oracleReserve > 0) {
      console.log("✅ DEX already has liquidity!");
      console.log(`   TTRUST: ${ethers.formatEther(tTrustReserve)} TTRUST`);
      console.log(`   ORACLE: ${ethers.formatEther(oracleReserve)} ORACLE`);
      const price = (oracleReserve * ethers.parseEther("1")) / tTrustReserve;
      console.log(`   Price: 1 TTRUST = ${ethers.formatEther(price)} ORACLE`);
      return;
    }
    
    // Approve DEX to spend ORACLE tokens
    console.log("🔄 Approving DEX to spend ORACLE tokens...");
    const approveTx = await oracleToken.approve(dexAddress, oracleForLiquidity);
    await approveTx.wait();
    console.log("✅ Approval confirmed");
    
    // Add liquidity
    console.log(`🔄 Adding ${ethers.formatEther(ethAmount)} TTRUST + ${ethers.formatEther(oracleForLiquidity)} ORACLE...`);
    const addLiquidityTx = await dex.addLiquidity(0, oracleForLiquidity, { 
      value: ethAmount,
      gasLimit: 1000000
    });
    
    console.log("⏳ Transaction sent:", addLiquidityTx.hash);
    const receipt = await addLiquidityTx.wait();
    console.log("✅ Liquidity added! Gas used:", receipt.gasUsed.toString());
    
    // Check final reserves
    const finalTTrustReserve = await dex.tTrustReserve();
    const finalOracleReserve = await dex.oracleReserve();
    
    console.log("📊 Final DEX reserves:");
    console.log(`   TTRUST: ${ethers.formatEther(finalTTrustReserve)} TTRUST`);
    console.log(`   ORACLE: ${ethers.formatEther(finalOracleReserve)} ORACLE`);
    
    const finalPrice = (finalOracleReserve * ethers.parseEther("1")) / finalTTrustReserve;
    console.log(`💰 Final price: 1 TTRUST = ${ethers.formatEther(finalPrice)} ORACLE`);
    
    console.log("🎉 DEX liquidity setup complete!");
    console.log("🔄 The frontend should now work without 'missing revert data' errors");
    
  } catch (error) {
    console.error("❌ Error adding liquidity:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
