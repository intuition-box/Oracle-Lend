import { ethers } from "hardhat";

async function main() {
  console.log("💰 Funding liquidator with ORACLE tokens...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  
  // Your liquidator address (from the error message)
  const liquidatorAddress = "0xAD50D6A764F10D531A759cc4b651FE3A96c7D03B";
  
  // Contract addresses
  const oracleTokenAddress = "0xF840731096FAeD511eFda466ACaD39531101fBAc";
  const oracleLendAddress = "0x5CdfBB614F07DA297fBfCb0Dcc9765463F2cCE9e";
  
  // Get contract instances
  const oracleToken = await ethers.getContractAt("OracleToken", oracleTokenAddress);
  const oracleLend = await ethers.getContractAt("OracleLend", oracleLendAddress);
  
  // Check current balances
  const liquidatorBalance = await oracleToken.balanceOf(liquidatorAddress);
  const deployerBalance = await oracleToken.balanceOf(deployer.address);
  const oracleLendBalance = await oracleLend.getContractOracleBalance();
  
  console.log("💰 Current ORACLE balances:");
  console.log(`   Liquidator: ${ethers.formatEther(liquidatorBalance)} ORACLE`);
  console.log(`   Deployer: ${ethers.formatEther(deployerBalance)} ORACLE`);
  console.log(`   OracleLend: ${ethers.formatEther(oracleLendBalance)} ORACLE`);
  
  // Amount to give to liquidator for liquidations
  const fundAmount = ethers.parseEther("100000"); // 100K ORACLE should be enough for liquidations
  
  console.log(`🎯 Target: Give liquidator ${ethers.formatEther(fundAmount)} ORACLE tokens`);
  
  // Try different funding methods
  
  // Method 1: If deployer has tokens, transfer directly
  if (deployerBalance >= fundAmount) {
    console.log("🔄 Method 1: Direct transfer from deployer...");
    const transferTx = await oracleToken.transfer(liquidatorAddress, fundAmount);
    await transferTx.wait();
    console.log("✅ Direct transfer successful!");
    
  // Method 2: If deployer can mint tokens
  } else {
    try {
      console.log("🔄 Method 2: Checking if deployer can mint tokens...");
      const isMinter = await oracleToken.isMinter(deployer.address);
      console.log(`   Is deployer a minter: ${isMinter}`);
      
      if (isMinter) {
        console.log(`🔄 Minting ${ethers.formatEther(fundAmount)} ORACLE tokens for liquidator...`);
        const mintTx = await oracleToken.mint(liquidatorAddress, fundAmount);
        await mintTx.wait();
        console.log("✅ Minting successful!");
      } else {
        console.log("❌ Deployer is not a minter");
        
        // Method 3: Emergency withdraw from OracleLend
        console.log("🔄 Method 3: Emergency withdraw from OracleLend...");
        try {
          const owner = await oracleLend.owner();
          if (owner.toLowerCase() === deployer.address.toLowerCase()) {
            console.log("🔄 Withdrawing from OracleLend...");
            const withdrawTx = await oracleLend.emergencyWithdrawOracle(fundAmount);
            await withdrawTx.wait();
            
            // Then transfer to liquidator
            const transferTx = await oracleToken.transfer(liquidatorAddress, fundAmount);
            await transferTx.wait();
            console.log("✅ Emergency withdraw and transfer successful!");
          } else {
            throw new Error("Deployer is not owner of OracleLend");
          }
        } catch (error) {
          console.error("❌ Emergency withdraw failed:", error.message);
          throw new Error("Could not fund liquidator - no available method worked");
        }
      }
    } catch (error) {
      console.error("❌ All funding methods failed:", error.message);
      throw error;
    }
  }
  
  // Check final balance
  const finalBalance = await oracleToken.balanceOf(liquidatorAddress);
  console.log(`✅ Final liquidator balance: ${ethers.formatEther(finalBalance)} ORACLE`);
  
  console.log("🎉 Liquidator funding complete!");
  console.log("💡 You should now be able to liquidate positions without the insufficient ORACLE error");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
