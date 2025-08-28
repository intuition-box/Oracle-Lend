import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Adding minimal liquidity to DEX...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Using deployer:", deployer.address);
  
  // Contract addresses from your deployment
  const dexAddress = "0x072c2b3f3937aD47Da25dE0de1e36E4C366d5FED";
  const oracleTokenAddress = "0xF840731096FAeD511eFda466ACaD39531101fBAc";
  
  // Get contract instances
  const dex = await ethers.getContractAt("DEX", dexAddress);
  const oracleToken = await ethers.getContractAt("OracleToken", oracleTokenAddress);
  
  console.log("📋 Contract addresses:");
  console.log(`   DEX: ${dexAddress}`);
  console.log(`   OracleToken: ${oracleTokenAddress}`);
  
  // Use very minimal amounts that should definitely be available
  const ethForLiquidity = ethers.parseEther("0.01"); // 0.01 TTRUST (very small)
  const oracleForLiquidity = ethers.parseEther("5000"); // 5K ORACLE (very small)
  
  console.log("💱 Adding minimal liquidity:");
  console.log(`   ${ethers.formatEther(ethForLiquidity)} TTRUST`);
  console.log(`   ${ethers.formatEther(oracleForLiquidity)} ORACLE`);
  console.log(`   Price: 1 TTRUST = ${ethers.formatEther(oracleForLiquidity / ethForLiquidity)} ORACLE`);
  
  // Check deployer balances
  const deployerEthBalance = await ethers.provider.getBalance(deployer.address);
  const deployerOracleBalance = await oracleToken.balanceOf(deployer.address);
  
  console.log("💰 Deployer balances:");
  console.log(`   TTRUST: ${ethers.formatEther(deployerEthBalance)} TTRUST`);
  console.log(`   ORACLE: ${ethers.formatEther(deployerOracleBalance)} ORACLE`);
  
  // Check if we have enough
  if (deployerEthBalance < ethForLiquidity) {
    throw new Error(`Insufficient TTRUST. Need ${ethers.formatEther(ethForLiquidity)}, have ${ethers.formatEther(deployerEthBalance)}`);
  }
  
  if (deployerOracleBalance < oracleForLiquidity) {
    throw new Error(`Insufficient ORACLE. Need ${ethers.formatEther(oracleForLiquidity)}, have ${ethers.formatEther(deployerOracleBalance)}`);
  }
  
  try {
    // Step 1: Check current reserves
    try {
      const tTrustReserve = await dex.tTrustReserve();
      const oracleReserve = await dex.oracleReserve();
      console.log("📊 Current DEX reserves:");
      console.log(`   TTRUST: ${ethers.formatEther(tTrustReserve)} TTRUST`);
      console.log(`   ORACLE: ${ethers.formatEther(oracleReserve)} ORACLE`);
      
      if (tTrustReserve > 0 && oracleReserve > 0) {
        console.log("✅ DEX already has liquidity!");
        const currentPrice = (oracleReserve * ethers.parseEther("1")) / tTrustReserve;
        console.log(`💰 Current price: 1 TTRUST = ${ethers.formatEther(currentPrice)} ORACLE`);
        return;
      }
    } catch (error) {
      console.log("⚠️ Could not check reserves, proceeding with liquidity addition...");
    }
    
    // Step 2: Approve DEX to spend ORACLE tokens
    console.log("🔄 Approving DEX to spend ORACLE tokens...");
    const approveTx = await oracleToken.approve(dexAddress, oracleForLiquidity);
    await approveTx.wait();
    console.log("✅ Approval confirmed");
    
    // Step 3: Add liquidity
    console.log("🔄 Adding liquidity to DEX...");
    const addLiquidityTx = await dex.addLiquidity(0, oracleForLiquidity, { 
      value: ethForLiquidity,
      gasLimit: 1000000 // Higher gas limit to be safe
    });
    
    console.log("⏳ Transaction sent:", addLiquidityTx.hash);
    const receipt = await addLiquidityTx.wait();
    console.log("✅ Liquidity added! Gas used:", receipt.gasUsed.toString());
    
    // Step 4: Check new reserves
    const newTTrustReserve = await dex.tTrustReserve();
    const newOracleReserve = await dex.oracleReserve();
    
    console.log("📊 New DEX reserves:");
    console.log(`   TTRUST: ${ethers.formatEther(newTTrustReserve)} TTRUST`);
    console.log(`   ORACLE: ${ethers.formatEther(newOracleReserve)} ORACLE`);
    
    // Calculate and display the price
    if (newTTrustReserve > 0 && newOracleReserve > 0) {
      const price = (newOracleReserve * ethers.parseEther("1")) / newTTrustReserve;
      console.log(`💰 Price set: 1 TTRUST = ${ethers.formatEther(price)} ORACLE`);
    }
    
    console.log("🎉 Minimal DEX liquidity setup complete!");
    console.log("🔄 The frontend should now work without 'missing revert data' errors");
    
  } catch (error) {
    console.error("❌ Error adding liquidity:", error);
    
    if (error.message.includes("execution reverted")) {
      console.log("\n🔍 Debugging tips:");
      console.log("1. Check if DEX already has liquidity");
      console.log("2. Verify token addresses match");
      console.log("3. Ensure sufficient token balances");
      console.log("4. Check if DEX contract is properly deployed");
    }
    
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
