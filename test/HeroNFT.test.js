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
      });

      describe("constructor", () => {
        it("sets starting values correctly", async function () {
          const heroTokenUriZero = await heroNFT.getHeroTokenUris(0);
          const isInitialized = await heroNFT.getInitialized();
          assert(heroTokenUriZero.includes("ipfs://"));
          assert.equal(isInitialized, true);
        });
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
            heroNFT.connect(minterAccount).requestNft(tokensTransfered)
          ).to.be.revertedWith("NeedMoreTokenToMint()");
        });

        it("emits an event and kicks off a random word request", async function () {
          const fee = await heroNFT.getMintFee();
          await expect(
            heroNFT.requestNft(hre.ethers.utils.parseEther("80"))
          ).to.emit(heroNFT, "NftRequested");
        });
      });

      describe("fullfillRandomWords", () => {
        it("mints NFT after random number is returned", async function () {
          await new Promise(async (resolve, reject) => {
            heroNFT.once("NftMinted", async () => {
              try {
                const tokenUri = await heroNFT.tokenURI("0");
                const tokenCounter = await heroNFT.getTokenIdCounter();
                assert.equal(tokenUri.toString().includes("ipfs://"), true);

                console.log(`Token Counter is ${tokenCounter}`);

                assert.equal(tokenCounter.toString(), "1");
                resolve();
              } catch (e) {
                console.log(e);
                reject(e);
              }
            });
            try {
              const fee = await heroNFT.getMintFee();
              const requestNftResponse = await heroNFT
                .connect(deployer)
                .requestNft(hre.ethers.utils.parseEther("90"));
              const requestNftReceipt = await requestNftResponse.wait(1);
              const nftRequestedEvent = requestNftReceipt.events.find(
                (event) => event.event == "NftRequested"
              );

              const [requestId] = nftRequestedEvent.args;

              await vrfCoordinatorV2Mock.fulfillRandomWords(
                requestId,
                heroNFT.address
              );
            } catch (e) {
              console.log(e);
              reject(e);
            }
          });
        });
      });

      describe("getHeroFromModdedRng", () => {
        // (0) WHALE, 0-2
        // (1) BITCOINER -> 2-10
        // (2) DEFI_DEGEN -> 10-25
        // (3) POLKA_AMAZON -> 25-50
        // (4) ETHEREAN -> 50 - 70
        // (5) HODLER -> >70 - 99

        it("should return WHALE if moddedRng < 2", async function () {
          const expectedValue = await heroNFT.getHeroFromModdedRng(1);
          assert.equal(0, expectedValue);
        });
        it("should return BITCOINER if moddedRng is between 2 - 10", async function () {
          const expectedValue = await heroNFT.getHeroFromModdedRng(5);
          assert.equal(1, expectedValue);
        });
        it("should return DEFI_DEGEN if moddedRng is between 10 - 25", async function () {
          const expectedValue = await heroNFT.getHeroFromModdedRng(22);
          assert.equal(2, expectedValue);
        });
        it("should return POLKA_AMAZON if moddedRng is between 25 - 50", async function () {
          const expectedValue = await heroNFT.getHeroFromModdedRng(49);
          assert.equal(3, expectedValue);
        });
        it("should return ETHEREAN if moddedRng is between 50 - 70", async function () {
          const expectedValue = await heroNFT.getHeroFromModdedRng(61);
          assert.equal(4, expectedValue);
        });
        it("should return HODLER if moddedRng is between 70 - 99", async function () {
          const expectedValue = await heroNFT.getHeroFromModdedRng(90);
          assert.equal(5, expectedValue);
        });
        it("should revert if moddedRng > 99", async function () {
          await expect(heroNFT.getHeroFromModdedRng(100)).to.be.revertedWith(
            "RangeOutOfBounds"
          );
        });
      });
    });
