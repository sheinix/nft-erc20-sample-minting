const { assert, expect } = require("chai");
const { ethers, deployments, network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("HeroNFT Tests", function () {
      let heroNFT;
      let heroERC20;
      let priceOfMint = 15;
      let minterAccount;

      beforeEach(async function () {
        // reset state before each test:
        await hre.network.provider.send("hardhat_reset");

        // Get deployer and minter of NFT:
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        minterAccount = accounts[1];
        await deployments.fixture(["mocks", "erc20NFTDeploy"]);

        // Get the Contracts
        heroERC20 = await ethers.getContract("HeroToken");
        heroNFT = await ethers.getContract("HeroNFT");
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");

        // Pre-approve the NFT to spend the ERC20:
        await heroERC20.approve(
          heroNFT.address,
          hre.ethers.utils.parseEther("100000")
        );

        // Allow the nft contract from the minter account to spend the erc20:
        await heroERC20
          .connect(minterAccount)
          .approve(heroNFT.address, hre.ethers.utils.parseEther("900"));

        // Random Mock Token URIs:
        randomMockTokenUris = [
          "TokenURI_1",
          "TokenURI_2",
          "TokenURI_3",
          "TokenURI_4",
          "TokenURI_5",
          "TokenURI_6",
        ];
      });

      // Test Minting:
      describe("NFT Minting", () => {
        it("Should reject mintings that don't have enough of token to mint", async function () {
          // send 5 token to minter
          // approve minter
          // expect mint to fail with error
          let tokensTransfered = hre.ethers.utils.parseEther("5");

          let transactionReceipt = await heroERC20.transfer(
            minterAccount.getAddress(),
            tokensTransfered
          );
          await transactionReceipt.wait(1);

          // Make sure minter has the transfered balance:
          let balanceOfMinter = await heroERC20.balanceOf(
            minterAccount.getAddress()
          );

          expect(balanceOfMinter).to.equal(tokensTransfered.toString());
          
          await expect(
            heroNFT.connect(minterAccount).requestNft()
          ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });

        it("emits an event and kicks off a random word request", async function () {
          const fee = await heroNFT.getMintFee();
          await expect(heroNFT.requestNft()).to.emit(heroNFT, "NftRequested");
        });

        // TODO: Fix this test:
        // it("Should reject initalizing contract after initial instantiation", async function () {
        //   await expect(
        //     deployments.fixture(["mocks", "erc20NFTDeploy"])
        //   ).to.be.revertedWith("AlreadyInitialized");
        // });
      });    
    }   
// test fullfill random words
// test getHeroFromModdedRng out of range
// test withdraw token only owner
