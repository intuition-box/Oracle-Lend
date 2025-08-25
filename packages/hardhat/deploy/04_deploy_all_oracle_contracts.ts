import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Final deployment script that sets up the complete Oracle Lend ecosystem
 * This runs after all individual contracts are deployed
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const setupOracleEcosystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  console.log("🚀 Setting up Oracle Lend Ecosystem...");

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

  // Optional: Set up initial liquidity or permissions if needed
  console.log("🔧 Setting up initial configurations...");

  // Add OracleLend as a minter for OracleToken (if needed for rewards/incentives)
  const isMinter = await oracleToken.isMinter(oracleLendAddress);
  if (!isMinter) {
    console.log("Adding OracleLend as minter for OracleToken...");
    const tx = await oracleToken.addMinter(oracleLendAddress);
    await tx.wait();
    console.log("✅ OracleLend added as minter");
  }

  // Log final ecosystem status
  console.log("✨ Oracle Lend Ecosystem Setup Complete!");
  console.log("");
  console.log("🎯 Next Steps:");
  console.log("1. Deploy actual tTRUST token contract");
  console.log("2. Update DEX with correct tTRUST address");
  console.log("3. Add initial liquidity to DEX");
  console.log("4. Configure additional lending markets in OracleLend");
  console.log("5. Test the complete ecosystem");
};

export default setupOracleEcosystem;

// This runs after all other Oracle contracts are deployed
setupOracleEcosystem.dependencies = ["OracleToken", "OracleLend", "DEX"];
setupOracleEcosystem.tags = ["OracleEcosystem"];
