const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  INITIAL_PRICE,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const {
  storeImages,
  storeTokeUriMetadata,
  storeJSONMetadataFilesInPinata,
} = require("../utils/uploadToPinata");

const FUND_AMOUNT = "1000000000000000000000";
const imagesLocation = "./images/";
const metadataLocation = "./nft-metadata/";

let tokenUris = []; //Empty for final commit

// Uploaded to Pinata:
const imageUris = [
  "ipfs://QmbQ6J2uNQWTYfiEjnVkwb2sSJMipkBPgrgQHKDrpUzqbU",
  "ipfs://QmbhB7S9yFHHcu7q6L8g8ffCYmsMup71wNeiaTETPwSoQd",
  "ipfs://QmdBSBo3NkWhv4eBJK6cdCbBvG6gV2MXNGMpmZ5yWXYyFk",
  "ipfs://Qmb7owtgFiPxz7eXHRZHdQ5GA8YBqvrisCWPjnTVhhLXAc",
  "ipfs://QmbWfJ9GktLCETztV5L2qT4YcHusmqQ6MA4qi3zr4oQFTb",
  "ipfs://QmdwAqRVBkEVy6SQgF9kUBE3JFTeQGGJbU7EGZ5f5fz7em",
];

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Mock, vrfCoordinatorV2Address, subscriptionId;

  // Upload metadata to Pinata/IPFS first
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await storeJSONMetadataFilesInPinata(metadataLocation);
  } else {
    // Hardcode already uploaded metadata for tests:
    tokenUris = [
      "ipfs://Qmd1dezwffba6g9HqNdG4vkvfB4K1LmBbEo5ps6Gd7ZfQ5",
      "ipfs://QmYJo632oAwxqwTWMW2VavAo2gBfwv6FNq2Bgxxa861kCU",
      "ipfs://QmdQHDGrpXaXLTD1jGVu1yq9MGocN6ZAM34qRMiQ22X8Jb",
      "ipfs://QmfJhGe2LB8LNVSpfJrSrwkT7hULea3Qg7A3FeZrfKKGqz",
      "ipfs://QmUVW7z8tds8NChiebD17DXhJW7w8oBxhxNtca9ac2PAxZ",
      "ipfs://QmbFeqUaQQdff7NvCALG5HXTtMj5Je9Cdb5X24m2nMftHD",
    ];
  }

  if (developmentChains.includes(network.name)) {
    log(" Deploying VRF Contracts in local environment...");

    // create VRFV2 Subscription
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
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
    INITIAL_PRICE,
    networkConfig[chainId]["callbackGasLimit"],
    tokenUris,
  ];

  log(" Deploying Hero NFT Token...");

  const heroNFT = await deploy("HeroNFT", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations:
      networkConfig[chainId]["verificationBlockConfirmations"] || 1,
  });

  // Make sure we add the contract as consumer to the vrfCoordinator on development:
  if (developmentChains.includes(network.name)) {
    log(" Adding Hero NFT Contract as VRF Consumer...");
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, heroNFT.address);
  }

  // Verify the deployment
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying NFT Contract...");
    await verify(heroNFT.address, arguments);
  }
};
module.exports.tags = ["all", "nftDeploy", "main"];
