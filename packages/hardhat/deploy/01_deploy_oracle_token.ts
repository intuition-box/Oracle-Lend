import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the OracleToken contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployOracleToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying OracleToken...");

  await deploy("OracleToken", {
    from: deployer,
    // Contract constructor arguments - OracleToken constructor takes no arguments
    args: [],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const oracleToken = await hre.ethers.getContract<Contract>("OracleToken", deployer);
  console.log("🪙 OracleToken deployed at:", await oracleToken.getAddress());
  
  // Log initial token info
  const tokenInfo = await oracleToken.getTokenInfo();
  console.log("📊 Token Info:");
  console.log(`   Name: ${tokenInfo[0]}`);
  console.log(`   Symbol: ${tokenInfo[1]}`);
  console.log(`   Total Supply: ${tokenInfo[3].toString()}`);
  console.log(`   Max Supply: ${tokenInfo[4].toString()}`);
};

export default deployOracleToken;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags OracleToken
deployOracleToken.tags = ["OracleToken"];
