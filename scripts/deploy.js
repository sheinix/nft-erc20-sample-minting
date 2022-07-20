const hre = require("hardhat");

async function main() {
  
  const deployer = hre.ethers.deployer;
  const signers = await hre.ethers.getSigners();
  const minter = await signers[0].getAddress();

  // Deploy Hero Token ERC20 First:
  const HeroToken = await hre.ethers.getContractFactory("HeroToken");
  const heroContract = await HeroToken.deploy();
  await heroContract.deployed();

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
  
  // await heroNFTContract.deployed();

  // console.log("Minter: " + minter)
  // console.log("Sending money to minter: " + minter)

  // let nftPrice = hre.ethers.utils.parseEther("15")
  // let minterBalance = hre.ethers.utils.parseEther("150")

  // let transactionReceipt = await heroContract.transfer(minter, minterBalance)
  
  // await transactionReceipt.wait(1);

  // const balanceOfMinter = await heroContract.balanceOf(minter);

  // console.log("Minter Balance: " + balanceOfMinter)
  
  // await heroContract.approve(heroNFTContract.address, minterBalance)

  // await heroNFTContract.safeMint(minter);


  // let currentTokenCount = await heroNFTContract.getTokenIdCounter()

  // console.log("CurrentTokenID Count:" + currentTokenCount)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
