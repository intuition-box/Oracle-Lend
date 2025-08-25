// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title OracleLend
 * @dev Decentralized lending and borrowing protocol on Intuition testnet
 * @notice Allows users to supply assets to earn interest and borrow against collateral
 */
contract OracleLend is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // State variables
    struct Market {
        IERC20 token;
        uint256 totalSupply;
        uint256 totalBorrow;
        uint256 supplyRate; // Annual percentage rate in basis points (e.g., 350 = 3.5%)
        uint256 borrowRate; // Annual percentage rate in basis points
        uint256 collateralFactor; // Percentage in basis points (e.g., 7500 = 75%)
        uint256 liquidationThreshold; // Percentage in basis points
        bool isActive;
    }

    struct UserAccount {
        mapping(address => uint256) supplied; // token => amount
        mapping(address => uint256) borrowed; // token => amount
        mapping(address => uint256) supplyIndex; // For interest calculation
        mapping(address => uint256) borrowIndex; // For interest calculation
    }

    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant LIQUIDATION_BONUS = 500; // 5% bonus for liquidators

    // State mappings
    mapping(address => Market) public markets;
    mapping(address => UserAccount) internal userAccounts;
    mapping(address => bool) public marketExists;
    address[] public allMarkets;

    // Events
    event MarketAdded(address indexed token, uint256 supplyRate, uint256 borrowRate);
    event Supply(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);
    event Borrow(address indexed user, address indexed token, uint256 amount);
    event Repay(address indexed user, address indexed token, uint256 amount);
    event Liquidation(
        address indexed liquidator,
        address indexed borrower,
        address indexed tokenCollateral,
        address tokenBorrowed,
        uint256 amountCollateral,
        uint256 amountBorrowed
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Add a new lending market
     * @param _token Token contract address
     * @param _supplyRate Supply interest rate in basis points
     * @param _borrowRate Borrow interest rate in basis points
     * @param _collateralFactor Collateral factor in basis points
     */
    function addMarket(
        address _token,
        uint256 _supplyRate,
        uint256 _borrowRate,
        uint256 _collateralFactor
    ) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!marketExists[_token], "Market already exists");
        require(_collateralFactor <= BASIS_POINTS, "Invalid collateral factor");
        require(_borrowRate > _supplyRate, "Borrow rate must be higher than supply rate");

        markets[_token] = Market({
            token: IERC20(_token),
            totalSupply: 0,
            totalBorrow: 0,
            supplyRate: _supplyRate,
            borrowRate: _borrowRate,
            collateralFactor: _collateralFactor,
            liquidationThreshold: _collateralFactor + 1000, // +10% buffer
            isActive: true
        });

        marketExists[_token] = true;
        allMarkets.push(_token);

        emit MarketAdded(_token, _supplyRate, _borrowRate);
    }

    /**
     * @dev Supply tokens to the lending pool
     * @param _token Token address to supply
     * @param _amount Amount to supply
     */
    function supply(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        require(marketExists[_token], "Market does not exist");
        require(_amount > 0, "Amount must be greater than 0");
        
        Market storage market = markets[_token];
        require(market.isActive, "Market is not active");

        // Update interest before changing balances
        _updateSupplyIndex(_token, msg.sender);

        // Transfer tokens from user
        market.token.safeTransferFrom(msg.sender, address(this), _amount);

        // Update user balance
        userAccounts[msg.sender].supplied[_token] = userAccounts[msg.sender].supplied[_token] + _amount;
        
        // Update market totals
        market.totalSupply = market.totalSupply + _amount;

        emit Supply(msg.sender, _token, _amount);
    }

    /**
     * @dev Withdraw supplied tokens
     * @param _token Token address to withdraw
     * @param _amount Amount to withdraw
     */
    function withdraw(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        require(marketExists[_token], "Market does not exist");
        require(_amount > 0, "Amount must be greater than 0");

        UserAccount storage account = userAccounts[msg.sender];
        require(account.supplied[_token] >= _amount, "Insufficient supply balance");

        // Update interest before changing balances
        _updateSupplyIndex(_token, msg.sender);

        // Check if withdrawal would make account unhealthy
        uint256 newSupplyBalance = account.supplied[_token] - _amount;
        require(_isAccountHealthy(msg.sender, _token, newSupplyBalance, account.supplied[_token]), "Withdrawal would make account unhealthy");

        // Update balances
        account.supplied[_token] = newSupplyBalance;
        markets[_token].totalSupply = markets[_token].totalSupply - _amount;

        // Transfer tokens to user
        markets[_token].token.safeTransfer(msg.sender, _amount);

        emit Withdraw(msg.sender, _token, _amount);
    }

    /**
     * @dev Borrow tokens against collateral
     * @param _token Token address to borrow
     * @param _amount Amount to borrow
     */
    function borrow(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        require(marketExists[_token], "Market does not exist");
        require(_amount > 0, "Amount must be greater than 0");
        
        Market storage market = markets[_token];
        require(market.isActive, "Market is not active");
        require(market.token.balanceOf(address(this)) >= _amount, "Insufficient liquidity");

        // Update interest before changing balances
        _updateBorrowIndex(_token, msg.sender);

        // Check if user can borrow this amount
        uint256 borrowPower = getBorrowPower(msg.sender);
        uint256 currentBorrowValue = getTotalBorrowValue(msg.sender);
        uint256 newBorrowValue = currentBorrowValue + _amount; // Simplified: assumes token price = 1

        require(newBorrowValue <= borrowPower, "Insufficient collateral");

        // Update user balance
        userAccounts[msg.sender].borrowed[_token] = userAccounts[msg.sender].borrowed[_token] + _amount;
        
        // Update market totals
        market.totalBorrow = market.totalBorrow + _amount;

        // Transfer tokens to user
        market.token.safeTransfer(msg.sender, _amount);

        emit Borrow(msg.sender, _token, _amount);
    }

    /**
     * @dev Repay borrowed tokens
     * @param _token Token address to repay
     * @param _amount Amount to repay
     */
    function repay(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        require(marketExists[_token], "Market does not exist");
        require(_amount > 0, "Amount must be greater than 0");

        UserAccount storage account = userAccounts[msg.sender];
        uint256 borrowBalance = account.borrowed[_token];
        require(borrowBalance > 0, "No debt to repay");

        // Update interest before changing balances
        _updateBorrowIndex(_token, msg.sender);

        // Cap amount to borrowed balance
        uint256 repayAmount = _amount > borrowBalance ? borrowBalance : _amount;

        // Transfer tokens from user
        markets[_token].token.safeTransferFrom(msg.sender, address(this), repayAmount);

        // Update balances
        account.borrowed[_token] = borrowBalance - repayAmount;
        markets[_token].totalBorrow = markets[_token].totalBorrow - repayAmount;

        emit Repay(msg.sender, _token, repayAmount);
    }

    /**
     * @dev Liquidate an unhealthy account
     * @param _borrower Address of the borrower to liquidate
     * @param _tokenCollateral Token address of collateral to seize
     * @param _tokenBorrowed Token address of borrowed asset to repay
     * @param _amount Amount to repay
     */
    function liquidate(
        address _borrower,
        address _tokenCollateral,
        address _tokenBorrowed,
        uint256 _amount
    ) external nonReentrant whenNotPaused {
        require(_borrower != msg.sender, "Cannot liquidate yourself");
        require(marketExists[_tokenCollateral] && marketExists[_tokenBorrowed], "Invalid markets");
        
        // Check if account is liquidatable
        require(!_isAccountHealthy(_borrower, address(0), 0, 0), "Account is healthy");
        
        UserAccount storage borrowerAccount = userAccounts[_borrower];
        uint256 borrowBalance = borrowerAccount.borrowed[_tokenBorrowed];
        require(borrowBalance > 0, "No debt to liquidate");
        
        // Cap liquidation amount
        uint256 liquidateAmount = _amount > borrowBalance ? borrowBalance : _amount;
        
        // Calculate collateral to seize (with liquidation bonus)
        uint256 collateralAmount = liquidateAmount * (BASIS_POINTS + LIQUIDATION_BONUS) / BASIS_POINTS;
        require(borrowerAccount.supplied[_tokenCollateral] >= collateralAmount, "Insufficient collateral");
        
        // Transfer repayment from liquidator
        markets[_tokenBorrowed].token.safeTransferFrom(msg.sender, address(this), liquidateAmount);
        
        // Update borrower balances
        borrowerAccount.borrowed[_tokenBorrowed] = borrowBalance - liquidateAmount;
        borrowerAccount.supplied[_tokenCollateral] = borrowerAccount.supplied[_tokenCollateral] - collateralAmount;
        
        // Update market totals
        markets[_tokenBorrowed].totalBorrow = markets[_tokenBorrowed].totalBorrow - liquidateAmount;
        markets[_tokenCollateral].totalSupply = markets[_tokenCollateral].totalSupply - collateralAmount;
        
        // Transfer collateral to liquidator
        markets[_tokenCollateral].token.safeTransfer(msg.sender, collateralAmount);
        
        emit Liquidation(msg.sender, _borrower, _tokenCollateral, _tokenBorrowed, collateralAmount, liquidateAmount);
    }

    // View functions

    /**
     * @dev Get user's borrow power (maximum amount they can borrow)
     */
    function getBorrowPower(address _user) public view returns (uint256) {
        uint256 totalCollateralValue = 0;
        
        for (uint256 i = 0; i < allMarkets.length; i++) {
            address token = allMarkets[i];
            uint256 supplied = userAccounts[_user].supplied[token];
            if (supplied > 0) {
                uint256 collateralValue = supplied * markets[token].collateralFactor / BASIS_POINTS;
                totalCollateralValue = totalCollateralValue + collateralValue;
            }
        }
        
        return totalCollateralValue;
    }

    /**
     * @dev Get user's total borrow value
     */
    function getTotalBorrowValue(address _user) public view returns (uint256) {
        uint256 totalBorrowValue = 0;
        
        for (uint256 i = 0; i < allMarkets.length; i++) {
            address token = allMarkets[i];
            uint256 borrowed = userAccounts[_user].borrowed[token];
            totalBorrowValue = totalBorrowValue + borrowed; // Simplified: assumes token price = 1
        }
        
        return totalBorrowValue;
    }

    /**
     * @dev Get user's health factor (collateral value / borrow value)
     */
    function getHealthFactor(address _user) external view returns (uint256) {
        uint256 borrowValue = getTotalBorrowValue(_user);
        if (borrowValue == 0) return type(uint256).max;
        
        uint256 collateralValue = getBorrowPower(_user) * BASIS_POINTS / 7500; // Assuming 75% collateral factor
        return collateralValue * BASIS_POINTS / borrowValue;
    }

    /**
     * @dev Get market utilization rate
     */
    function getUtilizationRate(address _token) external view returns (uint256) {
        Market storage market = markets[_token];
        if (market.totalSupply == 0) return 0;
        return market.totalBorrow * BASIS_POINTS / market.totalSupply;
    }

    /**
     * @dev Get user account info
     */
    function getUserAccount(address _user, address _token) external view returns (uint256 supplied, uint256 borrowed) {
        UserAccount storage account = userAccounts[_user];
        return (account.supplied[_token], account.borrowed[_token]);
    }

    /**
     * @dev Get all markets
     */
    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }

    // Internal functions

    function _updateSupplyIndex(address _token, address _user) internal {
        // Simplified interest calculation - in production, use compound interest
        UserAccount storage account = userAccounts[_user];
        account.supplyIndex[_token] = block.timestamp;
    }

    function _updateBorrowIndex(address _token, address _user) internal {
        // Simplified interest calculation - in production, use compound interest
        UserAccount storage account = userAccounts[_user];
        account.borrowIndex[_token] = block.timestamp;
    }

    function _isAccountHealthy(
        address _user,
        address _excludeToken,
        uint256 _newSupplyBalance,
        uint256 /* _oldSupplyBalance */
    ) internal view returns (bool) {
        uint256 totalCollateralValue = 0;
        uint256 totalBorrowValue = getTotalBorrowValue(_user);
        
        for (uint256 i = 0; i < allMarkets.length; i++) {
            address token = allMarkets[i];
            uint256 supplied;
            
            if (token == _excludeToken) {
                supplied = _newSupplyBalance;
            } else {
                supplied = userAccounts[_user].supplied[token];
            }
            
            if (supplied > 0) {
                uint256 collateralValue = supplied * markets[token].liquidationThreshold / BASIS_POINTS;
                totalCollateralValue = totalCollateralValue + collateralValue;
            }
        }
        
        return totalBorrowValue <= totalCollateralValue;
    }

    // Admin functions

    /**
     * @dev Pause the protocol
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the protocol
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Update market parameters
     */
    function updateMarket(
        address _token,
        uint256 _supplyRate,
        uint256 _borrowRate,
        uint256 _collateralFactor,
        bool _isActive
    ) external onlyOwner {
        require(marketExists[_token], "Market does not exist");
        require(_collateralFactor <= BASIS_POINTS, "Invalid collateral factor");
        
        Market storage market = markets[_token];
        market.supplyRate = _supplyRate;
        market.borrowRate = _borrowRate;
        market.collateralFactor = _collateralFactor;
        market.liquidationThreshold = _collateralFactor + 1000;
        market.isActive = _isActive;
    }

    /**
     * @dev Emergency withdrawal function for admin
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}
