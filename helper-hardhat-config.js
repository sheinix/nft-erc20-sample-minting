const { ethers } = require("hardhat");

const networkConfig = {
  default: {
    name: "hardhat",
    verificationBlockConfirmations: 1,
  },
  31337: {
    name: "localhost",
    subscriptionId: "588",
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
    callbackGasLimit: "500000", // 500,000 gas
    verificationBlockConfirmations: 1,
  },
  5: {
    name: "goerli",
    subscriptionId: "2901",
    gasLane:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 30 gwei
    callbackGasLimit: "500000", // 2,500,000 gas
    vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    verificationBlockConfirmations: 5,
  },
  4: {
    name: "rinkeby",
    subscriptionId: "6926",
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
    callbackGasLimit: "500000", // 500,000 gas
    vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    verificationBlockConfirmations: 5,
  },
  1: {
    name: "mainnet",
    verificationBlockConfirmations: 5,
  },

  // TODO: ADD MUMBAI NETWORK
};

const DECIMALS = "18";
const INITIAL_PRICE = hre.ethers.utils.parseEther("15");
const developmentChains = ["hardhat", "localhost"];

module.exports = {
  networkConfig,
  developmentChains,
  DECIMALS,
  INITIAL_PRICE,
};
