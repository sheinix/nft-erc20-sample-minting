const { ethers } = require("hardhat");

const networkConfig = {
  default: {
    name: "hardhat",
    keepersUpdateInterval: "30",
    verificationBlockConfirmations: 1,
  },
  31337: {
    name: "localhost",
    subscriptionId: "588",
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
    keepersUpdateInterval: "30",
    raffleEntranceFee: "100000000000000000", // 0.1 ETH
    callbackGasLimit: "500000", // 500,000 gas
    verificationBlockConfirmations: 1,
  },
  4: {
    name: "rinkeby",
    subscriptionId: "6926",
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
    keepersUpdateInterval: "30",
    raffleEntranceFee: "100000000000000000", // 0.1 ETH
    callbackGasLimit: "500000", // 500,000 gas
    vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    verificationBlockConfirmations: 5,
  },
  1: {
    name: "mainnet",
    keepersUpdateInterval: "30",
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
