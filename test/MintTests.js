// const { assert, expect } = require("chai")
const { ethers } = require("hardhat")

describe("HeroNFT", function () {
   
  let HeroNFT
  let HeroERC20
  let priceOfMint = 15

  beforeEach(async function() {
    
    // reset state before each test:
    await hre.network.provider.send("hardhat_reset")

    // deploy fresh contracts:
    const heroERC20 = await ethers.getContractFactory("HeroToken");
    HeroERC20 = await heroERC20.deploy();
    await HeroERC20.deployed()

    let heroNFT = await ethers.getContractFactory("HeroNFT");
    HeroNFT = await heroNFT.deploy(
       "DeFi Degen", 
       "Etherean", 
       "Hodler", 
       "PolkaAmazon",
       "Bitcoiner",
       HeroERC20.address,
       process.env.CHAINLINK_MUMBAI_SUBSCRIPTION_ID)
    await HeroNFT.deployed()
  })

  describe("NFT Minting", function () {

    it("Should reject mintings with less than 15 of token", async function () {
      
      // send 5 token to minter
      // approve minter
      // expect mint to fail with error
      const accounts = await ethers.getSigners()
      const minterAccount = accounts[1]
      let tokensTransfered = hre.ethers.utils.parseEther("5")

      let transactionReceipt = await HeroERC20.transfer(minterAccount.getAddress(), tokensTransfered)
      await transactionReceipt.wait(1);

      // Make sure minter has the transfered balance:
      let balanceOfMinter = await HeroERC20.balanceOf(minterAccount.getAddress()) 
      
      await expect(balanceOfMinter).to.equal(tokensTransfered.toString())

      // approve token expenditure
      await HeroERC20.approve(HeroNFT.address, hre.ethers.utils.parseEther("100"))

      await expect(HeroNFT.safeMint(minterAccount.getAddress()).to.be.revertedWith("Error: You need to pay 15 of Token to get the NFT"))
    });

  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
