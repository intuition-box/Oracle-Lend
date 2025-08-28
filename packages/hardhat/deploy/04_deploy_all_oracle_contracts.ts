import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import * as fs from "fs";
import * as path from "path";

// Load deployment configuration
const configPath = path.join(__dirname, "..", "config.json");
const deploymentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

/**
 * Final deployment script that sets up the complete Oracle Lend ecosystem
 * This runs after all individual contracts are deployed
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const setupOracleEcosystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  console.log("🚀 Setting up Oracle Lend Ecosystem...");
  console.log("📋 Using deployment configuration from:", path.basename(configPath));

  // Get all deployed contracts
  const oracleToken = await hre.ethers.getContract<Contract>("OracleToken", deployer);
  const oracleLend = await hre.ethers.getContract<Contract>("OracleLend", deployer);
  const dex = await hre.ethers.getContract<Contract>("DEX", deployer);

  const oracleTokenAddress = await oracleToken.getAddress();
  const oracleLendAddress = await oracleLend.getAddress();
  const dexAddress = await dex.getAddress();

  console.log("📋 Deployed Contracts Summary:");
  console.log(`   OracleToken: ${oracleTokenAddress}`);
  console.log(`   OracleLend: ${oracleLendAddress}`);
  console.log(`   DEX: ${dexAddress}`);

  console.log("🔧 Distributing Oracle Token Supply...");
  
  const lendingSupply = hre.ethers.parseEther(deploymentConfig.distribution.lendingProtocol.oracle); // From config.json
  
  // 1. Set up DEX liquidity with ETH + ORACLE
  console.log("💱 Setting up DEX liquidity...");
  console.log(`   Adding: ${deploymentConfig.distribution.dexLiquidity.ttrust} TTRUST + ${deploymentConfig.distribution.dexLiquidity.oracle} ORACLE`);
  console.log(`   Description: ${deploymentConfig.distribution.dexLiquidity.description}`);
  
  // Use 0.00001 TTRUST + 10,000 ORACLE tokens - minimal liquidity to test swaps
  const ethForLiquidity = hre.ethers.parseEther(deploymentConfig.distribution.dexLiquidity.ttrust); // 0.00001 TTRUST equivalent (minimal for testing)
  const oracleForLiquidity = hre.ethers.parseEther(deploymentConfig.distribution.dexLiquidity.oracle); // 10K ORACLE tokens
  
  // Approve DEX to spend ORACLE tokens
  await oracleToken.approve(dexAddress, oracleForLiquidity);
  
  // Add liquidity with ETH (send ETH in the transaction)
  await dex.addLiquidity(0, oracleForLiquidity, { value: ethForLiquidity });
  
  console.log(`✅ Added liquidity: ${hre.ethers.formatEther(ethForLiquidity)} TTRUST + ${hre.ethers.formatEther(oracleForLiquidity)} ORACLE`);
  
  // 2. Fund OracleLend with ORACLE tokens for lending
  console.log("🏦 Funding Lending Protocol...");
  console.log(`   Funding with: ${deploymentConfig.distribution.lendingProtocol.oracle} ORACLE tokens`);
  
  // Check current balance first
  const currentLendingBalance = await oracleLend.getContractOracleBalance();
  console.log(`   Current balance: ${hre.ethers.formatEther(currentLendingBalance)} ORACLE`);
  
  if (currentLendingBalance < lendingSupply) {
    const neededAmount = lendingSupply - currentLendingBalance;
    console.log(`   Need to add: ${hre.ethers.formatEther(neededAmount)} ORACLE`);
    
    // Approve OracleLend to spend ORACLE tokens
    await oracleToken.approve(oracleLendAddress, neededAmount);
    
    // Fund the contract
    await oracleLend.fundContract(neededAmount);
    
    const newBalance = await oracleLend.getContractOracleBalance();
    console.log(`✅ OracleLend funded with ${hre.ethers.formatEther(newBalance)} ORACLE tokens for lending`);
  } else {
    console.log("✅ OracleLend already has sufficient ORACLE tokens for lending");
  }
  
  // 3. Add OracleLend as a minter for OracleToken (if needed for rewards/incentives)
  const isMinter = await oracleToken.isMinter(oracleLendAddress);
  if (!isMinter) {
    console.log("Adding OracleLend as minter for OracleToken...");
    const tx = await oracleToken.addMinter(oracleLendAddress);
    await tx.wait();
    console.log("✅ OracleLend added as minter");
  }
  
  // 4. Transfer DEX ownership to user address
  // const userAddress = "0x261311201b215A00630519F394EA3eD7B52f44eb";
  // console.log(`🔄 Transferring DEX ownership to: ${userAddress}`);
  // await dex.transferOwnership(userAddress);
  // console.log("✅ DEX ownership transferred");

  // Log final distribution
  const deployerBalance = await oracleToken.balanceOf(deployer);
  const dexBalance = await oracleToken.balanceOf(dexAddress);
  const lendBalance = await oracleLend.getContractOracleBalance(); // Use the contract's method
  const dexEthBalance = await hre.ethers.provider.getBalance(dexAddress);
  
  console.log("📊 Final Token Distribution:");
  console.log(`   Deployer: ${hre.ethers.formatEther(deployerBalance)} ORACLE`);
  console.log(`   DEX: ${hre.ethers.formatEther(dexBalance)} ORACLE + ${hre.ethers.formatEther(dexEthBalance)} ETH`);
  console.log(`   OracleLend: ${hre.ethers.formatEther(lendBalance)} ORACLE`);

  // Log final ecosystem status
  console.log("✨ Oracle Lend Ecosystem Setup Complete!");
  console.log("");
  console.log("🎯 Ready to use:");
  console.log("1. 💱 DEX has liquidity for ETH ↔ ORACLE price discovery");
  console.log(`2. 🏦 OracleLend has ${deploymentConfig.distribution.lendingProtocol.oracle} ORACLE tokens available for borrowing`);
  console.log("3. 📈 Users can deposit ETH as collateral (120% ratio required)");
  console.log("4. 💰 Users can borrow ORACLE tokens against ETH collateral");
  console.log("5. ⚡ Liquidators earn 10% bonus for liquidating unsafe positions");
  console.log("6. 🔄 All contracts use DEX for real-time price oracle");
  console.log("");
  console.log("📋 How to use:");
  console.log("• Send ETH to OracleLend.addCollateral() to add collateral");
  console.log("• Call OracleLend.borrowOracle(amount) to borrow ORACLE tokens");
  console.log("• Call OracleLend.repayOracle(amount) to repay debt");
  console.log("• Call OracleLend.liquidate(user) to liquidate unsafe positions");
};

export default setupOracleEcosystem;

// This runs after all other Oracle contracts are deployed
setupOracleEcosystem.dependencies = ["OracleToken", "OracleLend", "DEX"];
setupOracleEcosystem.tags = ["OracleEcosystem"];
