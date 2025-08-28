import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import { parseEther } from "ethers";
import * as path from "path";

/**
 * Deploys the OracleLend contract (over-collateralized lending protocol)
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployOracleLend: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying OracleLend (over-collateralized lending)...");

  // Get the deployed DEX and OracleToken contracts
  const dex = await hre.ethers.getContract<Contract>("DEX", deployer);
  const oracleToken = await hre.ethers.getContract<Contract>("OracleToken", deployer);
  
  const dexAddress = await dex.getAddress();
  const oracleTokenAddress = await oracleToken.getAddress();

  console.log("Using DEX at:", dexAddress);
  console.log("Using OracleToken at:", oracleTokenAddress);

  await deploy("OracleLend", {
    from: deployer,
    // Constructor args: (address _dex, address _oracleToken)
    args: [dexAddress, oracleTokenAddress],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying
  const oracleLend = await hre.ethers.getContract<Contract>("OracleLend", deployer);
  console.log("🏦 OracleLend deployed at:", await oracleLend.getAddress());

  // Skip funding here - will be handled by the orchestrator script (04_deploy_all_oracle_contracts.ts)
  console.log("ℹ️  Skipping funding step - will be handled by orchestrator deployment script");
  
  // Just check current contract balances
  try {
    const oracleBalance = await oracleLend.getContractOracleBalance();
    console.log(`📊 Current contract ORACLE balance: ${hre.ethers.formatEther(oracleBalance)} ORACLE`);
  } catch (error) {
    console.log("📊 Contract ORACLE balance: 0 ORACLE (not yet funded)");
  }
  
  console.log("\n🎯 OracleLend Protocol Setup Complete!");
  console.log("📋 Protocol Features:");
  console.log("   • ETH as collateral");
  console.log("   • ORACLE tokens as borrowable asset");
  console.log("   • 120% collateralization ratio required");
  console.log("   • 10% liquidation bonus for liquidators");
  console.log("   • DEX-based price oracle");
};

export default deployOracleLend;

// This deployment depends on DEX and OracleToken being deployed first
deployOracleLend.dependencies = ["DEX", "OracleToken"];
deployOracleLend.tags = ["OracleLend"];
