import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import * as fs from "fs";
import * as path from "path";

// Load deployment configuration
const configPath = path.join(__dirname, "config.json");
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
  
  const halfSupply = hre.ethers.parseEther(deploymentConfig.distribution.lendingProtocol.oracle); // 5M tokens (half of 10M)
  
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
  
  // 2. Transfer 5M tokens to OracleLend for lending supply
  console.log("🏦 Providing supply to Lending Protocol...");
  await oracleToken.transfer(oracleLendAddress, halfSupply);
  console.log(`✅ Transferred ${hre.ethers.formatEther(halfSupply)} ORACLE tokens to OracleLend`);
  
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
  const lendBalance = await oracleToken.balanceOf(oracleLendAddress);
  const dexEthBalance = await hre.ethers.provider.getBalance(dexAddress);
  
  console.log("📊 Final Token Distribution:");
  console.log(`   Deployer: ${hre.ethers.formatEther(deployerBalance)} ORACLE`);
  console.log(`   DEX: ${hre.ethers.formatEther(dexBalance)} ORACLE + ${hre.ethers.formatEther(dexEthBalance)} TTRUST`);
  console.log(`   OracleLend: ${hre.ethers.formatEther(lendBalance)} ORACLE`);

  // Log final ecosystem status
  console.log("✨ Oracle Lend Ecosystem Setup Complete!");
  console.log("");
  console.log("🎯 Ready to use:");
  console.log("1. DEX has 10 TTRUST + 1000 ORACLE tokens for liquidity");
  console.log("2. OracleLend has 5M ORACLE tokens for lending");
  console.log("3. DEX owner remains deployer address (ownership not transferred)");
  console.log("4. You can now swap TTRUST ↔ ORACLE on the DEX");
  console.log("5. All contracts are ready for interaction");
};

export default setupOracleEcosystem;

// This runs after all other Oracle contracts are deployed
setupOracleEcosystem.dependencies = ["OracleToken", "OracleLend", "DEX"];
setupOracleEcosystem.tags = ["OracleEcosystem"];
