// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HeroToken is ERC20, ERC20Burnable, Ownable {
    constructor() ERC20("HeroToken", "HRO") {
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
