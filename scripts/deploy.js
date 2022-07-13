const hre = require("hardhat");

async function main() {
  
  // Deploy Hero Token ERC20 First:
  const HeroToken = await hre.ethers.getContractFactory("HeroToken");
  const heroContract = await HeroToken.deploy();

  // Deploy NFT Second:
  const HeroNFT = await hre.ethers.getContractFactory("HeroNFT");
  const heroNFTContract = await HeroNFT.deploy(
    "DeFi Degen", 
    "Etherean", 
    "Hodler", 
    "PolkaAmazon",
    "Bitcoiner",
    heroContract.address,
    process.env.CHAINLINK_MUMBAI_SUBSCRIPTION_ID
    );
  
  await heroNFTContract.deployed();

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
