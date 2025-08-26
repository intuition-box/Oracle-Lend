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

  
  console.log("⚠️  Note: DEX is using placeholder tTRUST address. Update with actual tTRUST token address when available.");
  console.log("ℹ️  Ownership transfer and liquidity provision will be handled by the orchestrator deployment script");
};

export default deployDEX;

// This deployment depends on OracleToken being deployed first
deployDEX.dependencies = ["OracleToken"];
deployDEX.tags = ["DEX"];
