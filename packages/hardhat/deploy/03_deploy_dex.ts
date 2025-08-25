import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the DEX contract
 * Note: This requires both tTRUST and ORACLE tokens to be available
 * For now, we'll use the OracleToken as ORACLE and assume tTRUST is deployed separately
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployDEX: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying DEX...");

  // Get the deployed OracleToken contract
  const oracleToken = await hre.ethers.getContract<Contract>("OracleToken", deployer);
  const oracleTokenAddress = await oracleToken.getAddress();

  // For demo purposes, we'll use the same token for both tTRUST and ORACLE
  // In production, you would have separate token contracts
  const tTrustAddress = oracleTokenAddress; // Placeholder - should be actual tTRUST token address
  
  console.log(`Using ORACLE token at: ${oracleTokenAddress}`);
  console.log(`Using tTRUST token at: ${tTrustAddress} (placeholder)`);

  await deploy("DEX", {
    from: deployer,
    // Contract constructor arguments
    args: [tTrustAddress, oracleTokenAddress],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const dex = await hre.ethers.getContract<Contract>("DEX", deployer);
  console.log("🔄 DEX deployed at:", await dex.getAddress());

  // Log DEX configuration
  const stats = await dex.getDEXStats();
  const limits = await dex.getTradingLimits();
  
  console.log("📊 DEX Configuration:");
  console.log(`   Exchange Rate: 1 tTRUST = ${await dex.EXCHANGE_RATE()} ORACLE`);
  console.log(`   Fee Rate: ${(await dex.FEE_RATE()).toString() / 100}%`);
  console.log(`   Max Price Impact: ${(await dex.MAX_PRICE_IMPACT()).toString() / 100}%`);
  console.log(`   Min Trade Amount: ${limits[0].toString()}`);
  console.log(`   Max Trade Amount: ${limits[1].toString()}`);
  
  console.log("⚠️  Note: DEX is using placeholder tTRUST address. Update with actual tTRUST token address when available.");
};

export default deployDEX;

// This deployment depends on OracleToken being deployed first
deployDEX.dependencies = ["OracleToken"];
deployDEX.tags = ["DEX"];
