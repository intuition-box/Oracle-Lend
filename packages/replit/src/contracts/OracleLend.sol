// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Import our DEX contract for price oracle
interface IDEX {
    function getPrice(address _token) external view returns (uint256 price);
    function tTRUST() external view returns (address);
    function ORACLE() external view returns (address);
    function tTrustReserve() external view returns (uint256);
    function oracleReserve() external view returns (uint256);
}

// Custom errors for gas efficiency
error OracleLend__InvalidAmount();
error OracleLend__TransferFailed();
error OracleLend__UnsafePositionRatio();
error OracleLend__BorrowingFailed();
error OracleLend__RepayingFailed();
error OracleLend__PositionSafe();
error OracleLend__NotLiquidatable();
error OracleLend__InsufficientLiquidatorORACLE();

/**
 * @title OracleLend
 * @dev Over-collateralized lending protocol using ETH as collateral and ORACLE as borrowable asset
 * @notice Based on SpeedRunEthereum lending challenge - uses DEX for price discovery
 */
contract OracleLend is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Constants
    uint256 private constant COLLATERAL_RATIO = 120; // 120% collateralization required
    uint256 private constant LIQUIDATION_BONUS = 10; // 10% bonus for liquidators
    
    // Contract references
    IERC20 public immutable oracleToken;    // ORACLE token (borrowable asset)
    IDEX public immutable dex;              // DEX contract for price oracle

    // User positions
    mapping(address => uint256) public userCollateral;  // ETH collateral in wei
    mapping(address => uint256) public userBorrowed;    // ORACLE tokens borrowed (18 decimals)

    // Events
    event CollateralAdded(address indexed user, uint256 indexed amount, uint256 price);
    event CollateralWithdrawn(address indexed user, uint256 indexed amount, uint256 price);
    event AssetBorrowed(address indexed user, uint256 indexed amount, uint256 price);
    event AssetRepaid(address indexed user, uint256 indexed amount, uint256 price);
    event Liquidation(
        address indexed user,
        address indexed liquidator,
        uint256 amountForLiquidator,
        uint256 liquidatedUserDebt,
        uint256 price
    );

    constructor(address _dex, address _oracleToken) Ownable(msg.sender) {
        require(_dex != address(0) && _oracleToken != address(0), "Invalid addresses");
        dex = IDEX(_dex);
        oracleToken = IERC20(_oracleToken);
        
        // Pre-approve for efficiency in liquidations
        oracleToken.approve(address(this), type(uint256).max);
    }

    /**
     * @notice Deposit ETH as collateral
     * @dev Users send ETH which is stored as collateral for borrowing ORACLE tokens
     */
    function addCollateral() external payable nonReentrant whenNotPaused {
        if (msg.value == 0) revert OracleLend__InvalidAmount();
        
        userCollateral[msg.sender] += msg.value;
        emit CollateralAdded(msg.sender, msg.value, getCurrentPrice());
    }

    /**
     * @notice Withdraw ETH collateral (if position remains healthy)
     * @param amount Amount of ETH to withdraw in wei
     */
    function withdrawCollateral(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0 || userCollateral[msg.sender] < amount) revert OracleLend__InvalidAmount();

        uint256 currentCollateral = userCollateral[msg.sender];
        uint256 newCollateral = currentCollateral - amount;
        uint256 debt = userBorrowed[msg.sender];

        // Check if withdrawal would make position unsafe
        if (debt > 0) {
            uint256 newCollateralValue = calculateCollateralValue(newCollateral);
            uint256 newRatio = (newCollateralValue * 100) / debt;
            if (newRatio < COLLATERAL_RATIO) revert OracleLend__UnsafePositionRatio();
        }

        userCollateral[msg.sender] = newCollateral;

        // Transfer ETH back to user
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert OracleLend__TransferFailed();

        emit CollateralWithdrawn(msg.sender, amount, getCurrentPrice());
    }

    /**
     * @notice Borrow ORACLE tokens against ETH collateral
     * @param borrowAmount Amount of ORACLE tokens to borrow (18 decimals)
     */
    function borrowOracle(uint256 borrowAmount) external nonReentrant whenNotPaused {
        if (borrowAmount == 0) revert OracleLend__InvalidAmount();

        // Check if contract has enough ORACLE tokens to lend
        require(oracleToken.balanceOf(address(this)) >= borrowAmount, "Insufficient ORACLE liquidity");

        // Optimistically increase debt then validate position (gas efficient pattern)
        userBorrowed[msg.sender] += borrowAmount;
        _validatePosition(msg.sender);

        // Transfer ORACLE tokens to borrower
        bool success = oracleToken.transfer(msg.sender, borrowAmount);
        if (!success) {
            // Revert the debt increase if transfer fails
            userBorrowed[msg.sender] -= borrowAmount;
            revert OracleLend__BorrowingFailed();
        }

        emit AssetBorrowed(msg.sender, borrowAmount, getCurrentPrice());
    }

    /**
     * @notice Repay ORACLE token debt
     * @param repayAmount Amount of ORACLE tokens to repay (user must approve first)
     */
    function repayOracle(uint256 repayAmount) external nonReentrant whenNotPaused {
        if (repayAmount == 0) revert OracleLend__InvalidAmount();
        
        uint256 debt = userBorrowed[msg.sender];
        if (repayAmount > debt) revert OracleLend__InvalidAmount();

        // Transfer ORACLE from user to contract
        bool success = oracleToken.transferFrom(msg.sender, address(this), repayAmount);
        if (!success) revert OracleLend__RepayingFailed();

        userBorrowed[msg.sender] = debt - repayAmount;
        emit AssetRepaid(msg.sender, repayAmount, getCurrentPrice());
    }

    /**
     * @notice Liquidate an unsafe position
     * @param user Address of the user to liquidate
     * @dev Liquidator must approve ORACLE tokens to this contract first
     */
    function liquidate(address user) external nonReentrant whenNotPaused {
        if (!isLiquidatable(user)) revert OracleLend__NotLiquidatable();
        
        uint256 userDebt = userBorrowed[user];
        if (userDebt == 0) revert OracleLend__NotLiquidatable();

        // Ensure liquidator has enough ORACLE tokens
        if (oracleToken.balanceOf(msg.sender) < userDebt) revert OracleLend__InsufficientLiquidatorORACLE();

        // Pull ORACLE tokens from liquidator to repay debt
        bool pulled = oracleToken.transferFrom(msg.sender, address(this), userDebt);
        if (!pulled) revert OracleLend__RepayingFailed();

        uint256 userCollateralAmount = userCollateral[user];
        uint256 collateralValue = calculateCollateralValue(userCollateralAmount);

        // Clear user's debt
        userBorrowed[user] = 0;

        // Calculate ETH collateral to give to liquidator
        uint256 collateralPurchased;
        if (collateralValue == 0) {
            collateralPurchased = userCollateralAmount;
        } else {
            // collateralPurchased = (userDebt * userCollateralAmount) / collateralValue
            collateralPurchased = (userDebt * userCollateralAmount) / collateralValue;
        }

        // Add liquidation bonus (10%)
        uint256 liquidationReward = (collateralPurchased * LIQUIDATION_BONUS) / 100;
        uint256 amountForLiquidator = collateralPurchased + liquidationReward;
        
        // Cap at available collateral
        if (amountForLiquidator > userCollateralAmount) {
            amountForLiquidator = userCollateralAmount;
        }

        userCollateral[user] = userCollateralAmount - amountForLiquidator;

        // Send ETH collateral to liquidator
        (bool sent, ) = payable(msg.sender).call{value: amountForLiquidator}("");
        if (!sent) revert OracleLend__TransferFailed();

        emit Liquidation(user, msg.sender, amountForLiquidator, userDebt, getCurrentPrice());
    }

    // View functions

    /**
     * @notice Get current ORACLE price in terms of ETH from DEX
     * @return price ORACLE per 1 ETH (18 decimals)
     */
    function getCurrentPrice() public view returns (uint256 price) {
        // Get tTRUST price in ORACLE (since we're using tTRUST as ETH equivalent)
        try dex.getPrice(dex.tTRUST()) returns (uint256 _price) {
            return _price;
        } catch {
            // Fallback: calculate from reserves if getPrice fails
            uint256 tTrustReserve = dex.tTrustReserve();
            uint256 oracleReserve = dex.oracleReserve();
            if (tTrustReserve > 0 && oracleReserve > 0) {
                return (oracleReserve * 1e18) / tTrustReserve;
            }
            return 0; // No liquidity
        }
    }

    /**
     * @notice Calculate collateral value in ORACLE terms
     * @param collateralAmount ETH collateral amount in wei
     * @return value Collateral value in ORACLE tokens (18 decimals)
     */
    function calculateCollateralValue(uint256 collateralAmount) public view returns (uint256 value) {
        uint256 price = getCurrentPrice(); // ORACLE per 1 ETH
        return (collateralAmount * price) / 1e18;
    }

    /**
     * @notice Check if a position is liquidatable (health ratio < 120%)
     * @param user Address to check
     * @return liquidatable True if position can be liquidated
     */
    function isLiquidatable(address user) public view returns (bool liquidatable) {
        uint256 debt = userBorrowed[user];
        if (debt == 0) return false;
        
        uint256 collateralValue = calculateCollateralValue(userCollateral[user]);
        uint256 healthRatio = (collateralValue * 100) / debt;
        
        return healthRatio < COLLATERAL_RATIO;
    }

    /**
     * @notice Get user's position health ratio (percentage)
     * @param user Address to check
     * @return ratio Health ratio as percentage (120 = 120%)
     */
    function getHealthRatio(address user) external view returns (uint256 ratio) {
        uint256 debt = userBorrowed[user];
        if (debt == 0) return type(uint256).max; // No debt = infinite health
        
        uint256 collateralValue = calculateCollateralValue(userCollateral[user]);
        return (collateralValue * 100) / debt;
    }

    /**
     * @notice Get maximum ORACLE amount a user can borrow
     * @param user Address to check
     * @return maxBorrow Maximum borrowable amount
     */
    function getMaxBorrowAmount(address user) external view returns (uint256 maxBorrow) {
        uint256 collateralValue = calculateCollateralValue(userCollateral[user]);
        uint256 currentDebt = userBorrowed[user];
        
        // Max borrowable = (collateralValue / COLLATERAL_RATIO) * 100 - currentDebt
        uint256 maxTotalBorrow = (collateralValue * 100) / COLLATERAL_RATIO;
        
        if (maxTotalBorrow > currentDebt) {
            return maxTotalBorrow - currentDebt;
        }
        return 0;
    }

    /**
     * @notice Get maximum ETH collateral a user can withdraw
     * @param user Address to check  
     * @return maxWithdraw Maximum withdrawable ETH amount
     */
    function getMaxWithdrawableCollateral(address user) external view returns (uint256 maxWithdraw) {
        uint256 debt = userBorrowed[user];
        if (debt == 0) return userCollateral[user]; // No debt = can withdraw all
        
        uint256 price = getCurrentPrice();
        if (price == 0) return 0; // No price = can't calculate
        
        // Minimum collateral needed = (debt * COLLATERAL_RATIO * 1e18) / (price * 100)
        uint256 minCollateralNeeded = (debt * COLLATERAL_RATIO * 1e18) / (price * 100);
        uint256 currentCollateral = userCollateral[user];
        
        if (currentCollateral > minCollateralNeeded) {
            return currentCollateral - minCollateralNeeded;
        }
        return 0;
    }

    /**
     * @notice Get user's complete position info
     * @param user Address to check
     * @return collateral ETH collateral amount
     * @return borrowed ORACLE debt amount  
     * @return collateralValue Collateral value in ORACLE
     * @return healthRatio Health ratio percentage
     * @return liquidatable Whether position can be liquidated
     */
    function getUserPosition(address user) external view returns (
        uint256 collateral,
        uint256 borrowed,
        uint256 collateralValue,
        uint256 healthRatio,
        bool liquidatable
    ) {
        collateral = userCollateral[user];
        borrowed = userBorrowed[user];
        collateralValue = calculateCollateralValue(collateral);
        
        if (borrowed == 0) {
            healthRatio = type(uint256).max;
            liquidatable = false;
        } else {
            healthRatio = (collateralValue * 100) / borrowed;
            liquidatable = healthRatio < COLLATERAL_RATIO;
        }
    }

    // Internal functions

    /**
     * @dev Validate that a user's position is healthy after a change
     * @param user Address to validate
     */
    function _validatePosition(address user) internal view {
        if (isLiquidatable(user)) revert OracleLend__UnsafePositionRatio();
    }

    // Admin functions

    /**
     * @notice Pause the protocol (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the protocol
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Fund the contract with ORACLE tokens for lending
     * @param amount Amount of ORACLE tokens to add
     */
    function fundContract(uint256 amount) external onlyOwner {
        oracleToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Emergency withdrawal of ORACLE tokens (only owner)
     * @param amount Amount of ORACLE tokens to withdraw
     */
    function emergencyWithdrawOracle(uint256 amount) external onlyOwner {
        oracleToken.safeTransfer(owner(), amount);
    }

    /**
     * @notice Emergency withdrawal of ETH (only owner)
     * @param amount Amount of ETH to withdraw
     */
    function emergencyWithdrawETH(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient ETH balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    /**
     * @notice Get contract's ORACLE token balance
     * @return balance Available ORACLE tokens for lending
     */
    function getContractOracleBalance() external view returns (uint256 balance) {
        return oracleToken.balanceOf(address(this));
    }

    /**
     * @notice Get contract's ETH balance
     * @return balance Available ETH balance
     */
    function getContractETHBalance() external view returns (uint256 balance) {
        return address(this).balance;
    }

    /**
     * @dev Function to receive ETH (for collateral deposits)
     */
    receive() external payable {
        // Allow ETH deposits via receive() - they will be added as collateral
        if (msg.value > 0) {
            userCollateral[msg.sender] += msg.value;
            emit CollateralAdded(msg.sender, msg.value, getCurrentPrice());
        }
    }
}
