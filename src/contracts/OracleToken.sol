// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title OracleToken
 * @dev ERC20 token for ORACLE LEND protocol on Intuition testnet
 * @notice ORACLE token with initial supply of 500,000,000,000,000 tokens
 */
contract OracleToken is ERC20, ERC20Burnable, Ownable, Pausable {
    
    // Constants
    uint256 public constant INITIAL_SUPPLY = 500_000_000_000_000 * 10**18; // 500 trillion tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000_000_000 * 10**18; // 1 quadrillion max supply
    
    // State variables
    mapping(address => bool) public minters;
    mapping(address => bool) public blacklisted;
    
    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event AddressBlacklisted(address indexed account);
    event AddressUnblacklisted(address indexed account);

    /**
     * @dev Constructor that gives msg.sender all of existing tokens
     */
    constructor() ERC20("Oracle Token", "ORACLE") {
        _mint(msg.sender, INITIAL_SUPPLY);
        minters[msg.sender] = true;
        emit MinterAdded(msg.sender);
    }

    /**
     * @dev Modifier to check if account is not blacklisted
     */
    modifier notBlacklisted(address account) {
        require(!blacklisted[account], "Account is blacklisted");
        _;
    }

    /**
     * @dev Modifier to check if caller is a minter
     */
    modifier onlyMinter() {
        require(minters[msg.sender], "Caller is not a minter");
        _;
    }

    /**
     * @dev Add a new minter
     * @param _minter Address to add as minter
     */
    function addMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter address");
        require(!minters[_minter], "Address is already a minter");
        
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }

    /**
     * @dev Remove a minter
     * @param _minter Address to remove from minters
     */
    function removeMinter(address _minter) external onlyOwner {
        require(minters[_minter], "Address is not a minter");
        require(_minter != owner(), "Cannot remove owner from minters");
        
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }

    /**
     * @dev Mint new tokens
     * @param _to Address to mint tokens to
     * @param _amount Amount of tokens to mint
     */
    function mint(address _to, uint256 _amount) external onlyMinter whenNotPaused {
        require(_to != address(0), "Cannot mint to zero address");
        require(_amount > 0, "Amount must be greater than 0");
        require(totalSupply() + _amount <= MAX_SUPPLY, "Would exceed max supply");
        
        _mint(_to, _amount);
        emit TokensMinted(_to, _amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     * @param _amount Amount of tokens to burn
     */
    function burn(uint256 _amount) public override whenNotPaused {
        super.burn(_amount);
        emit TokensBurned(msg.sender, _amount);
    }

    /**
     * @dev Burn tokens from specified account (requires allowance)
     * @param _account Account to burn tokens from
     * @param _amount Amount of tokens to burn
     */
    function burnFrom(address _account, uint256 _amount) public override whenNotPaused {
        super.burnFrom(_account, _amount);
        emit TokensBurned(_account, _amount);
    }

    /**
     * @dev Blacklist an account
     * @param _account Address to blacklist
     */
    function blacklistAccount(address _account) external onlyOwner {
        require(_account != address(0), "Cannot blacklist zero address");
        require(_account != owner(), "Cannot blacklist owner");
        require(!blacklisted[_account], "Account is already blacklisted");
        
        blacklisted[_account] = true;
        emit AddressBlacklisted(_account);
    }

    /**
     * @dev Remove account from blacklist
     * @param _account Address to unblacklist
     */
    function unblacklistAccount(address _account) external onlyOwner {
        require(blacklisted[_account], "Account is not blacklisted");
        
        blacklisted[_account] = false;
        emit AddressUnblacklisted(_account);
    }

    /**
     * @dev Pause token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Override transfer to include blacklist and pause checks
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        notBlacklisted(msg.sender) 
        notBlacklisted(to) 
        returns (bool) 
    {
        return super.transfer(to, amount);
    }

    /**
     * @dev Override transferFrom to include blacklist and pause checks
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        notBlacklisted(from) 
        notBlacklisted(to) 
        notBlacklisted(msg.sender) 
        returns (bool) 
    {
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Override approve to include blacklist checks
     */
    function approve(address spender, uint256 amount) 
        public 
        override 
        notBlacklisted(msg.sender) 
        notBlacklisted(spender) 
        returns (bool) 
    {
        return super.approve(spender, amount);
    }

    /**
     * @dev Get token information
     */
    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        uint256 maxSupply,
        uint256 initialSupply
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY,
            INITIAL_SUPPLY
        );
    }

    /**
     * @dev Check if account is a minter
     */
    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }

    /**
     * @dev Check if account is blacklisted
     */
    function isBlacklisted(address account) external view returns (bool) {
        return blacklisted[account];
    }

    /**
     * @dev Get circulating supply (total supply minus burned tokens)
     */
    function getCirculatingSupply() external view returns (uint256) {
        return totalSupply();
    }

    /**
     * @dev Emergency function to recover accidentally sent ERC20 tokens
     * @param _token Token contract address
     * @param _amount Amount to recover
     */
    function recoverERC20(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(this), "Cannot recover ORACLE tokens");
        IERC20(_token).transfer(owner(), _amount);
    }

    /**
     * @dev Emergency function to recover accidentally sent ETH
     */
    function recoverETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Batch transfer function for airdrops
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to transfer
     */
    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        whenNotPaused 
        notBlacklisted(msg.sender) 
    {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length <= 200, "Too many recipients");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(!blacklisted[recipients[i]], "Recipient is blacklisted");
            require(recipients[i] != address(0), "Invalid recipient address");
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
    }

    /**
     * @dev Function to receive ETH (for emergency recovery)
     */
    receive() external payable {}
}
