// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DEX
 * @dev Automated Market Maker (AMM) for tTRUST and ORACLE tokens
 * @notice Uses constant product formula (x * y = k) for free market price discovery
 */
contract DEX is ERC20, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant FEE_RATE = 30; // 0.3% trading fee
    uint256 public constant MINIMUM_LIQUIDITY = 1000; // Minimum liquidity locked forever

    // State variables
    IERC20 public immutable tTRUST;
    IERC20 public immutable ORACLE;
    
    uint256 public tTrustReserve;
    uint256 public oracleReserve;
    uint256 public totalVolume;
    uint256 public totalTrades;
    uint256 public kLast; // Last k value for protocol fee calculation

    // Events
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    event LiquidityAdded(
        address indexed provider, 
        uint256 tTrustAmount, 
        uint256 oracleAmount, 
        uint256 liquidity
    );
    event LiquidityRemoved(
        address indexed provider, 
        uint256 tTrustAmount, 
        uint256 oracleAmount, 
        uint256 liquidity
    );

    /**
     * @dev Constructor
     * @param _tTrust Address of tTRUST token (use ORACLE address for ETH testing)
     * @param _oracle Address of ORACLE token
     */
    constructor(address _tTrust, address _oracle) 
        ERC20("Oracle DEX LP", "OLP") 
        Ownable(msg.sender) 
    {
        require(_tTrust != address(0) && _oracle != address(0), "Invalid token addresses");
        tTRUST = IERC20(_tTrust);
        ORACLE = IERC20(_oracle);
    }

    /**
     * @dev Add liquidity to the pool - ALLOWS ANY RATIO for first provision
     * @param _tTrustAmount Amount of tTRUST tokens to add (use 0 when sending ETH)
     * @param _oracleAmount Amount of ORACLE tokens to add
     * @return liquidity LP tokens minted
     */
    function addLiquidity(
        uint256 _tTrustAmount,
        uint256 _oracleAmount
    ) external payable nonReentrant whenNotPaused returns (uint256 liquidity) {
        uint256 tTrustAmountActual;
        
        // Handle ETH as tTRUST for testing (when tTRUST address == ORACLE address)
        if (address(tTRUST) == address(ORACLE)) {
            require(msg.value > 0, "Must send ETH as tTRUST equivalent");
            require(_oracleAmount > 0, "ORACLE amount must be greater than 0");
            tTrustAmountActual = msg.value;
            ORACLE.safeTransferFrom(msg.sender, address(this), _oracleAmount);
        } else {
            // Normal tTRUST token operation
            require(_tTrustAmount > 0 && _oracleAmount > 0, "Amounts must be greater than 0");
            tTrustAmountActual = _tTrustAmount;
            tTRUST.safeTransferFrom(msg.sender, address(this), _tTrustAmount);
            ORACLE.safeTransferFrom(msg.sender, address(this), _oracleAmount);
        }

        uint256 _totalSupply = totalSupply();
        
        if (_totalSupply == 0) {
            // First liquidity provision - ANY RATIO ALLOWED!
            liquidity = sqrt(tTrustAmountActual * _oracleAmount) - MINIMUM_LIQUIDITY;
            _mint(address(1), MINIMUM_LIQUIDITY); // Lock minimum liquidity forever to dead address
        } else {
            // Subsequent liquidity provision - maintain current ratio
            liquidity = min(
                (tTrustAmountActual * _totalSupply) / tTrustReserve,
                (_oracleAmount * _totalSupply) / oracleReserve
            );
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        
        _mint(msg.sender, liquidity);
        
        // Update reserves
        tTrustReserve = tTrustReserve + tTrustAmountActual;
        oracleReserve = oracleReserve + _oracleAmount;
        kLast = tTrustReserve * oracleReserve;

        emit LiquidityAdded(msg.sender, tTrustAmountActual, _oracleAmount, liquidity);
    }

    /**
     * @dev Remove liquidity from the pool
     * @param _liquidity Amount of LP tokens to burn
     * @param _minTTrust Minimum tTRUST to receive
     * @param _minOracle Minimum ORACLE to receive
     * @return tTrustAmount Amount of tTRUST returned
     * @return oracleAmount Amount of ORACLE returned
     */
    function removeLiquidity(
        uint256 _liquidity,
        uint256 _minTTrust,
        uint256 _minOracle
    ) external nonReentrant returns (uint256 tTrustAmount, uint256 oracleAmount) {
        require(_liquidity > 0, "Insufficient liquidity");
        require(balanceOf(msg.sender) >= _liquidity, "Insufficient LP tokens");

        uint256 _totalSupply = totalSupply();
        
        tTrustAmount = (_liquidity * tTrustReserve) / _totalSupply;
        oracleAmount = (_liquidity * oracleReserve) / _totalSupply;
        
        require(tTrustAmount >= _minTTrust && oracleAmount >= _minOracle, "Insufficient output");
        require(tTrustAmount <= tTrustReserve && oracleAmount <= oracleReserve, "Insufficient reserves");

        _burn(msg.sender, _liquidity);

        // Update reserves
        tTrustReserve = tTrustReserve - tTrustAmount;
        oracleReserve = oracleReserve - oracleAmount;

        // Transfer tokens back to user
        if (address(tTRUST) == address(ORACLE)) {
            // Send ETH instead of tTRUST token
            (bool success, ) = payable(msg.sender).call{value: tTrustAmount}("");
            require(success, "ETH transfer failed");
        } else {
            tTRUST.safeTransfer(msg.sender, tTrustAmount);
        }
        ORACLE.safeTransfer(msg.sender, oracleAmount);

        kLast = tTrustReserve * oracleReserve;

        emit LiquidityRemoved(msg.sender, tTrustAmount, oracleAmount, _liquidity);
    }

    /**
     * @dev Swap tTRUST for ORACLE - NO LIMITS!
     * @param _amountIn Amount of tTRUST to swap (use 0 when sending ETH)
     * @param _minAmountOut Minimum amount of ORACLE to receive
     */
    function swapTrustForOracle(uint256 _amountIn, uint256 _minAmountOut) 
        external 
        payable
        nonReentrant 
        whenNotPaused 
    {
        uint256 amountInActual;
        
        // Handle ETH as tTRUST for testing (when tTRUST address == ORACLE address)
        if (address(tTRUST) == address(ORACLE)) {
            require(msg.value > 0, "Must send ETH as tTRUST equivalent");
            amountInActual = msg.value;
        } else {
            require(_amountIn > 0, "Amount must be greater than 0");
            amountInActual = _amountIn;
            tTRUST.safeTransferFrom(msg.sender, address(this), amountInActual);
        }
        
        require(tTrustReserve > 0 && oracleReserve > 0, "Insufficient liquidity");

        // Calculate output amount using constant product formula
        uint256 amountInWithFee = amountInActual * (BASIS_POINTS - FEE_RATE);
        uint256 numerator = amountInWithFee * oracleReserve;
        uint256 denominator = (tTrustReserve * BASIS_POINTS) + amountInWithFee;
        uint256 amountOut = numerator / denominator;
        
        require(amountOut >= _minAmountOut, "Insufficient output amount");
        require(amountOut < oracleReserve, "Insufficient ORACLE liquidity");

        // Transfer ORACLE to user
        ORACLE.safeTransfer(msg.sender, amountOut);

        // Update reserves
        tTrustReserve = tTrustReserve + amountInActual;
        oracleReserve = oracleReserve - amountOut;

        // Update statistics
        totalVolume = totalVolume + amountInActual;
        totalTrades = totalTrades + 1;

        // Ensure k doesn't decrease
        require(tTrustReserve * oracleReserve >= kLast, "K invariant violation");
        kLast = tTrustReserve * oracleReserve;

        emit Swap(msg.sender, address(tTRUST), address(ORACLE), amountInActual, amountOut, amountInActual * FEE_RATE / BASIS_POINTS);
    }

    /**
     * @dev Swap ORACLE for tTRUST - NO LIMITS!
     * @param _amountIn Amount of ORACLE to swap
     * @param _minAmountOut Minimum amount of tTRUST to receive
     */
    function swapOracleForTrust(uint256 _amountIn, uint256 _minAmountOut) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(_amountIn > 0, "Amount must be greater than 0");
        require(tTrustReserve > 0 && oracleReserve > 0, "Insufficient liquidity");

        ORACLE.safeTransferFrom(msg.sender, address(this), _amountIn);

        // Calculate output amount using constant product formula
        uint256 amountInWithFee = _amountIn * (BASIS_POINTS - FEE_RATE);
        uint256 numerator = amountInWithFee * tTrustReserve;
        uint256 denominator = (oracleReserve * BASIS_POINTS) + amountInWithFee;
        uint256 amountOut = numerator / denominator;
        
        require(amountOut >= _minAmountOut, "Insufficient output amount");
        require(amountOut < tTrustReserve, "Insufficient tTRUST liquidity");

        // Transfer tTRUST to user
        if (address(tTRUST) == address(ORACLE)) {
            // Send ETH instead of tTRUST token
            (bool success, ) = payable(msg.sender).call{value: amountOut}("");
            require(success, "ETH transfer failed");
        } else {
            tTRUST.safeTransfer(msg.sender, amountOut);
        }

        // Update reserves
        oracleReserve = oracleReserve + _amountIn;
        tTrustReserve = tTrustReserve - amountOut;

        // Update statistics
        totalVolume = totalVolume + (_amountIn * tTrustReserve / oracleReserve); // Convert to tTRUST equivalent
        totalTrades = totalTrades + 1;

        // Ensure k doesn't decrease
        require(tTrustReserve * oracleReserve >= kLast, "K invariant violation");
        kLast = tTrustReserve * oracleReserve;

        emit Swap(msg.sender, address(ORACLE), address(tTRUST), _amountIn, amountOut, _amountIn * FEE_RATE / BASIS_POINTS);
    }

    /**
     * @dev Get swap quote for exact input
     * @param _tokenIn Input token address
     * @param _amountIn Input amount
     * @return amountOut Output amount after fees
     */
    function getAmountOut(address _tokenIn, uint256 _amountIn) 
        public 
        view 
        returns (uint256 amountOut) 
    {
        require(_tokenIn == address(tTRUST) || _tokenIn == address(ORACLE), "Invalid token");
        require(_amountIn > 0, "Amount must be greater than 0");
        require(tTrustReserve > 0 && oracleReserve > 0, "Insufficient liquidity");

        uint256 amountInWithFee = _amountIn * (BASIS_POINTS - FEE_RATE);
        
        if (_tokenIn == address(tTRUST)) {
            uint256 numerator = amountInWithFee * oracleReserve;
            uint256 denominator = (tTrustReserve * BASIS_POINTS) + amountInWithFee;
            amountOut = numerator / denominator;
        } else {
            uint256 numerator = amountInWithFee * tTrustReserve;
            uint256 denominator = (oracleReserve * BASIS_POINTS) + amountInWithFee;
            amountOut = numerator / denominator;
        }
    }

    /**
     * @dev Get current price of token in terms of the other token
     * @param _token Token to get price for
     * @return price Price in 18 decimal places
     */
    function getPrice(address _token) external view returns (uint256 price) {
        require(_token == address(tTRUST) || _token == address(ORACLE), "Invalid token");
        require(tTrustReserve > 0 && oracleReserve > 0, "No liquidity");
        
        if (_token == address(tTRUST)) {
            // Price of tTRUST in ORACLE
            price = (oracleReserve * 1e18) / tTrustReserve;
        } else {
            // Price of ORACLE in tTRUST
            price = (tTrustReserve * 1e18) / oracleReserve;
        }
    }

    /**
     * @dev Get DEX statistics
     */
    function getDEXStats() external view returns (
        uint256 _tTrustReserve,
        uint256 _oracleReserve,
        uint256 _totalVolume,
        uint256 _totalTrades,
        uint256 _totalLiquidity
    ) {
        return (tTrustReserve, oracleReserve, totalVolume, totalTrades, totalSupply());
    }

    // Admin functions

    /**
     * @dev Pause trading
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Resume trading
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal function (only in extreme cases)
     * @param _token Token address to withdraw
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }

    // Helper functions

    /**
     * @dev Square root function using Babylonian method
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    /**
     * @dev Returns the minimum of two numbers
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Function to receive ETH (for emergency recovery and ETH handling)
     */
    receive() external payable {}
}