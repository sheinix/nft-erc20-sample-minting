// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";


contract HeroNFT is ERC721, ERC721Burnable, Ownable, VRFConsumerBaseV2 {
    using Counters for Counters.Counter;

    // ChainLink variables:
    VRFCoordinatorV2Interface COORDINATOR;
    // @notice the mumbai network chainlink vrf coordinator contract for generating random numbers:
    // https://docs.chain.link/docs/vrf-contracts/#polygon-matic-mainnet
    address vrfCoordinator = 0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed;

    // keyHash is the gasLane to use on the request - specifies the max gas price to bump to
    // docs: https://docs.chain.link/docs/chainlink-vrf/
    bytes32 keyHash = 0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f;

    uint64 s_subscriptionId;

    // We only store 2 values (each word cost 20000 gas, so 100000 is a safe limit)
    uint32 callbackGasLimit = 100000;
    
    // We will retrieve 2 random values in one request:
    // Cannot exceed VRFCoordinatorV2.MAX_NUM_WORDS.
    uint32 numValues = 2;

    // Stay with the default request confirmations of 3:
    uint16 requestConfirmations = 3;
    uint256[] public s_randomValues;
    uint256 public s_requestId;

    // Contract Variables:
    // @notice the relation between heroType and tokenID
    mapping(uint256 => string) heroType;

    // @notice the reference to the token that will be used as payment for minting
    address public token;

    Counters.Counter private _tokenIdCounter;

    constructor(string memory _H0,
                string memory _H1,
                string memory _H2,
                string memory _H3,
                string memory _H4,
                address _token,
                uint64 subscriptionId
    ) ERC721("HeroNFT", "HRO") VRFConsumerBaseV2(vrfCoordinator) {
        heroType[0] = _H0;
        heroType[0] = _H1;
        heroType[0] = _H2;
        heroType[0] = _H3;
        heroType[0] = _H4;
        token = _token;

        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
    }
    
    function tokenURI(uint256 tokenId)
    public 
    view
    virtual
    override
    returns (string memory) {
        require(_exists(tokenId), "erc721 URI doesn't exist for current TokenId");
        //@notice is a WIP (for testing purposes only) - pointing to the json on pinata:
        return "ipfs://QmPpRpHoC44yE4Jfby583k4HETA4xuCLaACz61sw8URibY";
    }

    function getTokenIdCounter() public virtual returns (uint256) {
        return _tokenIdCounter.current();
    }

    function safeMint(address to) public onlyOwner {
        
        // Require to transfer money (15 units of token) before mint:
        require(ERC20(token).transferFrom(msg.sender, address(this), 15), "Error: You need to pay 15 of Token to get the NFT");

        uint256 tokenId = _tokenIdCounter.current();
       _tokenIdCounter.increment();
       _safeMint(to, tokenId);
    }

    /**
     @notice Assumes the subscription is funded sufficently. 
     Transaction will revert if subscription is not set and funded.
     */
    function requestRandomWords() external onlyOwner {
       s_requestId = COORDINATOR.requestRandomWords(
           keyHash,
           s_subscriptionId,
           requestConfirmations,
           callbackGasLimit,
           numValues);
    }

    /// @notice that this will update the state vars
    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomValues)
         internal 
         override {
            s_randomValues = randomValues;
    }

    function withdrawToken(uint256 _amount) public onlyOwner {
        ERC20(token).transfer(msg.sender, _amount);
    }
}
