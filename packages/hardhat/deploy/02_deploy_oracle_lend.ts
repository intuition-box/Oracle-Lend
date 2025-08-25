import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the OracleLend contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployOracleLend: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying OracleLend...");

  await deploy("OracleLend", {
    from: deployer,
    // Contract constructor arguments - OracleLend constructor takes no arguments
    args: [],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const oracleLend = await hre.ethers.getContract<Contract>("OracleLend", deployer);
  console.log("🏦 OracleLend deployed at:", await oracleLend.getAddress());

  // Get the deployed OracleToken contract
  const oracleToken = await hre.ethers.getContract<Contract>("OracleToken", deployer);
  const oracleTokenAddress = await oracleToken.getAddress();

  // Add ORACLE token market to OracleLend
  console.log("Adding ORACLE token market to OracleLend...");
  
  const supplyRate = 350; // 3.5% APY
  const borrowRate = 800; // 8% APY
  const collateralFactor = 7500; // 75% collateral factor

  const tx = await oracleLend.addMarket(
    oracleTokenAddress,
    supplyRate,
    borrowRate,
    collateralFactor
  );
  await tx.wait();

  console.log("✅ ORACLE token market added to OracleLend");
  console.log(`   Supply Rate: ${supplyRate / 100}%`);
  console.log(`   Borrow Rate: ${borrowRate / 100}%`);
  console.log(`   Collateral Factor: ${collateralFactor / 100}%`);
};

export default deployOracleLend;

// This deployment depends on OracleToken being deployed first
deployOracleLend.dependencies = ["OracleToken"];
deployOracleLend.tags = ["OracleLend"];
