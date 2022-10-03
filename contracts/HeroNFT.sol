// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

error AlreadyInitialized();
error NeedMoreTokenToMint();
error RangeOutOfBounds();

contract HeroNFT is ERC721URIStorage, Ownable, VRFConsumerBaseV2 {
    using Counters for Counters.Counter;

    // Types
    enum HeroType {
        WHALE,
        BITCOINER,
        DEFI_DEGEN,
        POLKA_AMAZON,
        ETHEREAN,
        HODLER
    }
    
    // @notice the mumbai network chainlink vrf coordinator contract for generating random numbers:
    // https://docs.chain.link/docs/vrf-contracts/#polygon-matic-mainnet
    //address vrfCoordinator = 0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed;

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // NFT Variables
    Counters.Counter private _tokenIdCounter;
    uint256 private immutable i_mintFee;    
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_herosTokenUris;
    bool private s_initialized;
    
    // @notice the relation between heroType and tokenID
    mapping(uint256 => HeroType) private s_tokenIdToHero;

    // @notice the mapping to match a user/address to a requestId from the VRF
    mapping(uint256 => address) public s_requestIdToSender;

    // Events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(HeroType heroType, address minter);
    
    // @notice the reference to the token that will be used as payment for minting
    address public token;

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint256 mintFee,
        uint32 callbackGasLimit,
        string[6] memory heroTokenUris,
        address _token 
    ) ERC721("HeroNFT", "HRO") VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_mintFee = mintFee;
        i_callbackGasLimit = callbackGasLimit;
        token = _token;
        _initializeContract(heroTokenUris);
    }
    
    function _initializeContract(string[6] memory heroTokenUris) private {
        require(heroTokenUris.length == 6, "HeroTokenUris Not Correct Number, initalize with 6 hero types");
        if (s_initialized) {
            revert AlreadyInitialized();
        }
        s_herosTokenUris = heroTokenUris;
        s_initialized = true;
    }

    /**
     @notice Assumes the subscription is funded sufficently. 
     Transaction will revert if subscription is not set and funded.
     */
    function requestNft(uint256 tokenAmount) public payable returns (uint256 requestId) {
        if(tokenAmount < i_mintFee) {
            revert NeedMoreTokenToMint();
        }
        
        // Require to transfer money (i_mintFee units of token) before mint:
        require(IERC20(token).transferFrom(msg.sender, address(this), i_mintFee), "Error: You need to pay in the token to get the NFT");

        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address heroOwner = s_requestIdToSender[requestId];
        uint256 newItemId = _tokenIdCounter.current();
       _tokenIdCounter.increment();
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        HeroType herotype = getHeroFromModdedRng(moddedRng);
        _safeMint(heroOwner, newItemId);
        _setTokenURI(newItemId, s_herosTokenUris[uint256(herotype)]);
        emit NftMinted(herotype, heroOwner);
    }
    
    function getHeroFromModdedRng(uint256 moddedRng) public pure returns (HeroType) {
        uint256 cumulativeSum = 0;
        uint256[6] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            // if (moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]) {
            if (moddedRng >= cumulativeSum && moddedRng < chanceArray[i]) {
                return HeroType(i);
            }
            // cumulativeSum = cumulativeSum + chanceArray[i];
            cumulativeSum = chanceArray[i];
        }
        revert RangeOutOfBounds();
    }

    function withdrawToken(uint256 _amount) public onlyOwner {
       IERC20(token).transfer(msg.sender, _amount);
    }

    /**
    @notice this method sets the chances of each index to happen when
    requeting randomeness for the nft metadata generation 
    */
    function getChanceArray() public pure returns (uint256[6] memory) {
        return [2, 10, 25, 50, 70, MAX_CHANCE_VALUE];
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getHeroTokenUris(uint256 index) public view returns (string memory) {
        return s_herosTokenUris[index];
    }

    function getTokenIdCounter() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    function getInitialized() public view returns (bool) {
        return s_initialized;
    }
}
