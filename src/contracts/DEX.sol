// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title DEX
 * @dev Decentralized exchange for tTRUST and ORACLE tokens
 * @notice Fixed exchange rate: 1 tTRUST = 100 ORACLE
 */
contract DEX is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Constants
    uint256 public constant EXCHANGE_RATE = 100; // 1 tTRUST = 100 ORACLE
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_PRICE_IMPACT = 500; // 5% max price impact
    uint256 public constant FEE_RATE = 30; // 0.3% trading fee

    // State variables
    IERC20 public immutable tTRUST;
    IERC20 public immutable ORACLE;
    
    uint256 public tTrustReserve;
    uint256 public oracleReserve;
    uint256 public totalVolume;
    uint256 public totalTrades;
    uint256 public feesCollected;

    // Trading limits
    uint256 public maxTradeAmount = 1000 * 10**18; // 1000 tokens max per trade
    uint256 public minTradeAmount = 0.01 * 10**18; // 0.01 tokens min per trade

    // Events
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee,
        uint256 priceImpact
    );
    event LiquidityAdded(address indexed provider, uint256 tTrustAmount, uint256 oracleAmount);
    event LiquidityRemoved(address indexed provider, uint256 tTrustAmount, uint256 oracleAmount);
    event FeesCollected(address indexed collector, uint256 amount);
    event TradingLimitsUpdated(uint256 minAmount, uint256 maxAmount);

    /**
     * @dev Constructor
     * @param _tTrust Address of tTRUST token
     * @param _oracle Address of ORACLE token
     */
    constructor(address _tTrust, address _oracle) {
        require(_tTrust != address(0) && _oracle != address(0), "Invalid token addresses");
        tTRUST = IERC20(_tTrust);
        ORACLE = IERC20(_oracle);
    }

    /**
     * @dev Add initial liquidity to the DEX
     * @param _tTrustAmount Amount of tTRUST tokens to add
     * @param _oracleAmount Amount of ORACLE tokens to add
     */
    function addLiquidity(uint256 _tTrustAmount, uint256 _oracleAmount) external onlyOwner {
        require(_tTrustAmount > 0 && _oracleAmount > 0, "Amounts must be greater than 0");
        require(_oracleAmount == _tTrustAmount.mul(EXCHANGE_RATE), "Invalid ratio");

        tTRUST.safeTransferFrom(msg.sender, address(this), _tTrustAmount);
        ORACLE.safeTransferFrom(msg.sender, address(this), _oracleAmount);

        tTrustReserve = tTrustReserve.add(_tTrustAmount);
        oracleReserve = oracleReserve.add(_oracleAmount);

        emit LiquidityAdded(msg.sender, _tTrustAmount, _oracleAmount);
    }

    /**
     * @dev Remove liquidity from the DEX
     * @param _tTrustAmount Amount of tTRUST tokens to remove
     * @param _oracleAmount Amount of ORACLE tokens to remove
     */
    function removeLiquidity(uint256 _tTrustAmount, uint256 _oracleAmount) external onlyOwner {
        require(_tTrustAmount <= tTrustReserve && _oracleAmount <= oracleReserve, "Insufficient reserves");

        tTrustReserve = tTrustReserve.sub(_tTrustAmount);
        oracleReserve = oracleReserve.sub(_oracleAmount);

        tTRUST.safeTransfer(msg.sender, _tTrustAmount);
        ORACLE.safeTransfer(msg.sender, _oracleAmount);

        emit LiquidityRemoved(msg.sender, _tTrustAmount, _oracleAmount);
    }

    /**
     * @dev Swap tTRUST for ORACLE
     * @param _amountIn Amount of tTRUST to swap
     * @param _minAmountOut Minimum amount of ORACLE to receive
     */
    function swapTrustForOracle(uint256 _amountIn, uint256 _minAmountOut) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(_amountIn >= minTradeAmount && _amountIn <= maxTradeAmount, "Amount out of limits");
        require(_amountIn > 0, "Amount must be greater than 0");

        // Calculate output amount with price impact
        (uint256 amountOut, uint256 fee, uint256 priceImpact) = getSwapAmountOut(address(tTRUST), _amountIn);
        require(amountOut >= _minAmountOut, "Insufficient output amount");
        require(priceImpact <= MAX_PRICE_IMPACT, "Price impact too high");
        require(amountOut <= oracleReserve, "Insufficient ORACLE liquidity");

        // Transfer tokens
        tTRUST.safeTransferFrom(msg.sender, address(this), _amountIn);
        ORACLE.safeTransfer(msg.sender, amountOut);

        // Update reserves
        tTrustReserve = tTrustReserve.add(_amountIn);
        oracleReserve = oracleReserve.sub(amountOut);

        // Update statistics
        totalVolume = totalVolume.add(_amountIn);
        totalTrades = totalTrades.add(1);
        feesCollected = feesCollected.add(fee);

        emit Swap(msg.sender, address(tTRUST), address(ORACLE), _amountIn, amountOut, fee, priceImpact);
    }

    /**
     * @dev Swap ORACLE for tTRUST
     * @param _amountIn Amount of ORACLE to swap
     * @param _minAmountOut Minimum amount of tTRUST to receive
     */
    function swapOracleForTrust(uint256 _amountIn, uint256 _minAmountOut) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(_amountIn >= minTradeAmount && _amountIn <= maxTradeAmount.mul(EXCHANGE_RATE), "Amount out of limits");
        require(_amountIn > 0, "Amount must be greater than 0");

        // Calculate output amount with price impact
        (uint256 amountOut, uint256 fee, uint256 priceImpact) = getSwapAmountOut(address(ORACLE), _amountIn);
        require(amountOut >= _minAmountOut, "Insufficient output amount");
        require(priceImpact <= MAX_PRICE_IMPACT, "Price impact too high");
        require(amountOut <= tTrustReserve, "Insufficient tTRUST liquidity");

        // Transfer tokens
        ORACLE.safeTransferFrom(msg.sender, address(this), _amountIn);
        tTRUST.safeTransfer(msg.sender, amountOut);

        // Update reserves
        oracleReserve = oracleReserve.add(_amountIn);
        tTrustReserve = tTrustReserve.sub(amountOut);

        // Update statistics
        totalVolume = totalVolume.add(_amountIn.div(EXCHANGE_RATE)); // Convert to tTRUST equivalent
        totalTrades = totalTrades.add(1);
        feesCollected = feesCollected.add(fee);

        emit Swap(msg.sender, address(ORACLE), address(tTRUST), _amountIn, amountOut, fee, priceImpact);
    }

    /**
     * @dev Get swap quote
     * @param _tokenIn Input token address
     * @param _amountIn Input amount
     * @return amountOut Output amount after fees and price impact
     * @return fee Fee amount
     * @return priceImpact Price impact in basis points
     */
    function getSwapAmountOut(address _tokenIn, uint256 _amountIn) 
        public 
        view 
        returns (uint256 amountOut, uint256 fee, uint256 priceImpact) 
    {
        require(_tokenIn == address(tTRUST) || _tokenIn == address(ORACLE), "Invalid token");
        require(_amountIn > 0, "Amount must be greater than 0");

        if (_tokenIn == address(tTRUST)) {
            // tTRUST -> ORACLE
            uint256 expectedOut = _amountIn.mul(EXCHANGE_RATE);
            
            // Calculate price impact based on reserve ratio
            priceImpact = _amountIn.mul(BASIS_POINTS).div(tTrustReserve.add(_amountIn));
            if (priceImpact > MAX_PRICE_IMPACT) priceImpact = MAX_PRICE_IMPACT;
            
            // Apply price impact
            uint256 impactAdjusted = expectedOut.mul(BASIS_POINTS.sub(priceImpact)).div(BASIS_POINTS);
            
            // Calculate fee
            fee = impactAdjusted.mul(FEE_RATE).div(BASIS_POINTS);
            amountOut = impactAdjusted.sub(fee);
        } else {
            // ORACLE -> tTRUST
            uint256 expectedOut = _amountIn.div(EXCHANGE_RATE);
            
            // Calculate price impact based on reserve ratio
            priceImpact = _amountIn.mul(BASIS_POINTS).div(oracleReserve.add(_amountIn));
            if (priceImpact > MAX_PRICE_IMPACT) priceImpact = MAX_PRICE_IMPACT;
            
            // Apply price impact
            uint256 impactAdjusted = expectedOut.mul(BASIS_POINTS.sub(priceImpact)).div(BASIS_POINTS);
            
            // Calculate fee (in tTRUST)
            fee = impactAdjusted.mul(FEE_RATE).div(BASIS_POINTS);
            amountOut = impactAdjusted.sub(fee);
        }
    }

    /**
     * @dev Get current exchange rate (accounting for price impact)
     * @param _tokenIn Input token address
     * @param _amountIn Input amount
     * @return rate Effective exchange rate
     */
    function getExchangeRate(address _tokenIn, uint256 _amountIn) external view returns (uint256 rate) {
        (uint256 amountOut, , ) = getSwapAmountOut(_tokenIn, _amountIn);
        
        if (_tokenIn == address(tTRUST)) {
            rate = amountOut.mul(10**18).div(_amountIn); // ORACLE per tTRUST
        } else {
            rate = _amountIn.mul(10**18).div(amountOut); // ORACLE per tTRUST
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
        uint256 _feesCollected
    ) {
        return (tTrustReserve, oracleReserve, totalVolume, totalTrades, feesCollected);
    }

    /**
     * @dev Get trading limits
     */
    function getTradingLimits() external view returns (uint256 min, uint256 max) {
        return (minTradeAmount, maxTradeAmount);
    }

    /**
     * @dev Check if trade is within limits
     * @param _tokenIn Input token address
     * @param _amountIn Input amount
     */
    function isTradeValid(address _tokenIn, uint256 _amountIn) external view returns (bool) {
        if (_tokenIn == address(tTRUST)) {
            return _amountIn >= minTradeAmount && _amountIn <= maxTradeAmount;
        } else {
            return _amountIn >= minTradeAmount && _amountIn <= maxTradeAmount.mul(EXCHANGE_RATE);
        }
    }

    // Admin functions

    /**
     * @dev Update trading limits
     * @param _minAmount New minimum trade amount
     * @param _maxAmount New maximum trade amount
     */
    function updateTradingLimits(uint256 _minAmount, uint256 _maxAmount) external onlyOwner {
        require(_minAmount > 0 && _maxAmount > _minAmount, "Invalid limits");
        minTradeAmount = _minAmount;
        maxTradeAmount = _maxAmount;
        emit TradingLimitsUpdated(_minAmount, _maxAmount);
    }

    /**
     * @dev Collect trading fees
     * @param _amount Amount of fees to collect (in ORACLE)
     */
    function collectFees(uint256 _amount) external onlyOwner {
        require(_amount <= feesCollected, "Insufficient fees");
        require(_amount <= oracleReserve, "Insufficient ORACLE balance");
        
        feesCollected = feesCollected.sub(_amount);
        oracleReserve = oracleReserve.sub(_amount);
        ORACLE.safeTransfer(owner(), _amount);
        
        emit FeesCollected(msg.sender, _amount);
    }

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
     * @dev Emergency withdrawal function
     * @param _token Token address to withdraw
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }

    /**
     * @dev Get reserves ratio
     */
    function getReservesRatio() external view returns (uint256) {
        if (tTrustReserve == 0) return 0;
        return oracleReserve.mul(10**18).div(tTrustReserve);
    }

    /**
     * @dev Calculate liquidity depth
     * @param _tokenIn Input token address
     * @return depth Available liquidity for the token
     */
    function getLiquidityDepth(address _tokenIn) external view returns (uint256 depth) {
        if (_tokenIn == address(tTRUST)) {
            depth = tTrustReserve;
        } else if (_tokenIn == address(ORACLE)) {
            depth = oracleReserve;
        }
    }
}
