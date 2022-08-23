const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const {
  storeImages,
  storeTokeUriMetadata,
} = require("../utils/uploadToPinata");

const FUND_AMOUNT = "1000000000000000000000";
const imagesLocation = "./images/";
let tokenUris = [
  "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
  "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
  "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
];

// Uploaded to Pinata:
const imageUris = [
  "ipfs://QmbQ6J2uNQWTYfiEjnVkwb2sSJMipkBPgrgQHKDrpUzqbU",
  "ipfs://QmbhB7S9yFHHcu7q6L8g8ffCYmsMup71wNeiaTETPwSoQd",
  "ipfs://QmdBSBo3NkWhv4eBJK6cdCbBvG6gV2MXNGMpmZ5yWXYyFk",
  "ipfs://Qmb7owtgFiPxz7eXHRZHdQ5GA8YBqvrisCWPjnTVhhLXAc",
  "ipfs://QmbWfJ9GktLCETztV5L2qT4YcHusmqQ6MA4qi3zr4oQFTb",
  "ipfs://QmdwAqRVBkEVy6SQgF9kUBE3JFTeQGGJbU7EGZ5f5fz7em",
];

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "Cuteness",
      value: 100,
    },
  ],
};

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Address, subscriptionId;

  // ---> Deploy Hero Token ERC20 First:
  log(" Deploying Hero ERC20 Token...");

  const HeroToken = await hre.ethers.getContractFactory("HeroToken");
  const heroContract = await HeroToken.deploy();
  await heroContract.deployed();

  // ----> Deploy NFT Second:
  // Upload metadata to Pinata/IPFS first
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris();
  }

  if (developmentChains.includes(network.name)) {
    log(" Deploying VRF Contracts in local environment...");

    // create VRFV2 Subscription
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait();
    subscriptionId = transactionReceipt.events[0].args.subId;
    // Fund the subscription
    // Our mock makes it so we don't actually have to worry about sending fund
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  log("----------------------------------------------------");

  arguments = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[chainId]["gasLane"],
    networkConfig[chainId]["mintFee"],
    networkConfig[chainId]["callbackGasLimit"],
    tokenUris,
    heroContract.address,
  ];

  log(" Deploying Hero ERC20 Token...");

  const heroNFT = await deploy("HeroNFT", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: VERIFICATION_BLOCK_CONFIRMATIONS || 1,
  });

  // Verify the deployment
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(heroNFT.address, arguments);
  }
};

async function handleTokenUris() {
  tokenUris = [];
  const { responses: imageUploadResponses, files } = await storeImages(
    imagesLocation
  );
  for (imageUploadResponseIndex in imageUploadResponses) {
    let tokenUriMetadata = { ...metadataTemplate };
    tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "");
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
    console.log(`Uploading ${tokenUriMetadata.name}...`);
    const metadataUploadResponse = await storeTokeUriMetadata(tokenUriMetadata);
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }
  console.log("Token URIs uploaded! They are:");
  console.log(tokenUris);
  return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"];
