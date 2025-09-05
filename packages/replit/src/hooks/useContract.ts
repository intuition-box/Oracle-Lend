import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { TokenBalance, UserPosition, LendingPool, UserLendingPosition, LendingProtocolStats } from '../types'
import { INTUITION_TESTNET, LENDING_CONFIG, PROTOCOL_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants'

// Contract ABIs - simplified versions with only the functions we need
const ORACLE_LEND_ABI = [
  // View functions
  "function userCollateral(address) external view returns (uint256)",
  "function userBorrowed(address) external view returns (uint256)", 
  "function getCurrentPrice() external view returns (uint256)",
  "function getUserPosition(address) external view returns (uint256 collateral, uint256 borrowed, uint256 collateralValue, uint256 healthRatio, bool liquidatable)",
  "function getHealthRatio(address) external view returns (uint256)",
  "function getMaxBorrowAmount(address) external view returns (uint256)",
  "function getMaxWithdrawableCollateral(address) external view returns (uint256)",
  "function getContractOracleBalance() external view returns (uint256)",
  "function getContractETHBalance() external view returns (uint256)",
  "function isLiquidatable(address) external view returns (bool)",
  
  // State changing functions
  "function addCollateral() external payable",
  "function withdrawCollateral(uint256 amount) external",
  "function borrowOracle(uint256 borrowAmount) external", 
  "function repayOracle(uint256 repayAmount) external",
  "function liquidate(address user) external",
  
  // Events
  "event CollateralAdded(address indexed user, uint256 indexed amount, uint256 price)",
  "event CollateralWithdrawn(address indexed user, uint256 indexed amount, uint256 price)",
  "event AssetBorrowed(address indexed user, uint256 indexed amount, uint256 price)",
  "event AssetRepaid(address indexed user, uint256 indexed amount, uint256 price)",
  "event Liquidation(address indexed user, address indexed liquidator, uint256 amountForLiquidator, uint256 liquidatedUserDebt, uint256 price)"
]

const ORACLE_TOKEN_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function mint(address to, uint256 amount) external returns (bool)",
  "function isMinter(address account) external view returns (bool)",
  "function owner() external view returns (address)"
]

const DEX_ABI = [
  "function getPrice(address token) external view returns (uint256)",
  "function tTrustReserve() external view returns (uint256)",
  "function oracleReserve() external view returns (uint256)",
  "function swapTrustForOracle(uint256 amountIn, uint256 minAmountOut) external payable",
  "function swapOracleForTrust(uint256 amountIn, uint256 minAmountOut) external"
]

export const useContract = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  
  // Real contract instances
  const [oracleLendContract, setOracleLendContract] = useState<ethers.Contract | null>(null)
  const [oracleTokenContract, setOracleTokenContract] = useState<ethers.Contract | null>(null)
  const [dexContract, setDexContract] = useState<ethers.Contract | null>(null)
  
  // Real state from contracts
  const [userLendingPosition, setUserLendingPosition] = useState<UserLendingPosition>({
    collateral: '0',
    borrowed: '0',
    collateralValue: '0',
    healthRatio: 0,
    status: 'none',
    maxBorrow: '0',
    maxWithdraw: '0'
  })

  const [protocolStats, setProtocolStats] = useState<LendingProtocolStats>({
    oracleBalance: '0',
    ethBalance: '0',
    currentPrice: '0',
    totalCollateral: '0',
    totalBorrowed: '0',
    utilizationRate: 0
  })

  // Legacy state for backwards compatibility
  const [exchangeRates, setExchangeRates] = useState({
    tTRUST_ORACLE: 1,
    tTRUST_INTUIT: 100,
    ORACLE_INTUIT: 0.0002
  })

  const [userPosition, setUserPosition] = useState<UserPosition>({
    supplied: { tTRUST: '0', ORACLE: '0', INTUIT: '0' },
    borrowed: { tTRUST: '0', ORACLE: '0', INTUIT: '0' },
    collateralValue: '0',
    borrowPower: '0',
    healthFactor: 999
  })

  const [lendingPools] = useState<LendingPool[]>([
    {
      token: 'tTRUST',
      totalSupply: '0',
      totalBorrow: '0',
      supplyAPY: 0,
      borrowAPY: 0,
      utilizationRate: 0
    },
    {
      token: 'ORACLE',
      totalSupply: '0',
      totalBorrow: '0',
      supplyAPY: 0,
      borrowAPY: 0,
      utilizationRate: 0
    }
  ])

  // Initialize Web3 connection
  const initializeWeb3 = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        
        const provider = new ethers.BrowserProvider(window.ethereum)
        const network = await provider.getNetwork()
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        
        
        setProvider(provider)
        setSigner(signer)
        setUserAddress(address)

        // Initialize contracts with error handling
        try {
          const oracleLend = new ethers.Contract(
            INTUITION_TESTNET.contracts.oracleLend,
            ORACLE_LEND_ABI,
            signer
          )
          
          const oracleToken = new ethers.Contract(
            INTUITION_TESTNET.contracts.oracleToken,
            ORACLE_TOKEN_ABI,
            signer
          )
          
          const dex = new ethers.Contract(
            INTUITION_TESTNET.contracts.dex,
            DEX_ABI,
            signer
          )

          // Test contract connections with simple calls
          
          try {
            const oracleBalance = await oracleToken.balanceOf(address)
          } catch (tokenError) {
          }

          try {
            const userCollateral = await oracleLend.userCollateral(address)
          } catch (lendError) {
          }

          setOracleLendContract(oracleLend)
          setOracleTokenContract(oracleToken)
          setDexContract(dex)


          return true
        } catch (contractError) {
          // Production: Remove console statement
          setError(`Contract initialization failed: ${contractError.message}`)
          return false
        }
      } else {
        // Production: Remove console statement
        setError('Please install MetaMask or another Web3 wallet')
        return false
      }
    } catch (err) {
      // Production: Remove console statement
      setError(`Failed to connect to wallet: ${err.message}`)
      return false
    }
  }, [])

  // Fetch real data from contracts with error handling
  const fetchContractData = useCallback(async () => {
    if (!oracleLendContract || !oracleTokenContract || !dexContract || !userAddress) return

    try {
      // Production: Remove console statement

      // Get user position with individual error handling
      let userPosition = {
        collateral: '0',
        borrowed: '0', 
        collateralValue: '0',
        healthRatio: 0,
        liquidatable: false
      }

      try {
        const [collateral, borrowed, collateralValue, healthRatio, liquidatable] = 
          await oracleLendContract.getUserPosition(userAddress)
        
        userPosition = {
          collateral: collateral.toString(),
          borrowed: borrowed.toString(),
          collateralValue: collateralValue.toString(),
          healthRatio: Number(healthRatio),
          liquidatable
        }
      } catch (positionError) {
        // Try individual calls as fallback
        try {
          const collateral = await oracleLendContract.userCollateral(userAddress)
          const borrowed = await oracleLendContract.userBorrowed(userAddress)
          userPosition.collateral = collateral.toString()
          userPosition.borrowed = borrowed.toString()
        } catch (fallbackError) {
        }
      }

      // Get protocol stats with individual error handling
      let protocolData = {
        oracleBalance: '0',
        ethBalance: '0',
        currentPrice: '0'
      }

      try {
        const oracleBalance = await oracleLendContract.getContractOracleBalance()
        protocolData.oracleBalance = oracleBalance.toString()
      } catch (err) {
      }

      try {
        const ethBalance = await oracleLendContract.getContractETHBalance()
        protocolData.ethBalance = ethBalance.toString()
      } catch (err) {
      }

      try {
        const currentPrice = await oracleLendContract.getCurrentPrice()
        protocolData.currentPrice = currentPrice.toString()
      } catch (err) {
        // Set a default price if DEX has no liquidity
        protocolData.currentPrice = '500000000000000000000000' // 500k ORACLE per ETH as fallback
      }

      // Update user lending position
      setUserLendingPosition({
        collateral: userPosition.collateral,
        borrowed: userPosition.borrowed,
        collateralValue: userPosition.collateralValue,
        healthRatio: userPosition.healthRatio,
        status: userPosition.liquidatable ? 'danger' : userPosition.healthRatio >= 150 ? 'safe' : userPosition.healthRatio >= 130 ? 'warning' : 'danger',
        maxBorrow: '0', // Skip complex calculations for now
        maxWithdraw: '0' // Skip complex calculations for now
      })

      // Update protocol stats
      setProtocolStats({
        oracleBalance: protocolData.oracleBalance,
        ethBalance: protocolData.ethBalance,
        currentPrice: protocolData.currentPrice,
        totalCollateral: protocolData.ethBalance, // Simplified
        totalBorrowed: '0', // Would need additional contract call
        utilizationRate: 0 // Would need calculation
      })

      // Update exchange rates
      const priceInNumber = Number(ethers.formatEther(protocolData.currentPrice))
      setExchangeRates(prev => ({
        ...prev,
        tTRUST_ORACLE: priceInNumber
      }))

      // Update legacy position for backwards compatibility
      setUserPosition({
        supplied: { 
          tTRUST: ethers.formatEther(userPosition.collateral), 
          ORACLE: '0', 
          INTUIT: '0' 
        },
        borrowed: { 
          tTRUST: '0', 
          ORACLE: ethers.formatEther(userPosition.borrowed), 
          INTUIT: '0' 
        },
        collateralValue: ethers.formatEther(userPosition.collateralValue),
        borrowPower: '0', // Would need calculation
        healthFactor: userPosition.healthRatio / 100
      })

    } catch (err) {
      // Production: Remove console statement
      setError('Failed to fetch contract data')
    }
  }, [oracleLendContract, oracleTokenContract, dexContract, userAddress])

  // Real contract functions

  /**
   * Add ETH collateral to the lending protocol
   */
  const addCollateral = useCallback(async (amount: string) => {
    if (!oracleLendContract || !signer) {
      throw new Error('Contract not initialized')
    }

    setIsLoading(true)
    setError(null)

    try {
      const value = ethers.parseEther(amount)
      const tx = await oracleLendContract.addCollateral({ value })
      
      // Production: Remove console statement
      
      const receipt = await tx.wait()
      // Production: Remove console statement

      // Refresh data
      await fetchContractData()

      return {
        success: true,
        txHash: tx.hash,
        message: SUCCESS_MESSAGES.COLLATERAL_ADDED
      }
    } catch (err: any) {
      // Production: Remove console statement
      const errorMsg = err.reason || err.message || ERROR_MESSAGES.UNKNOWN_ERROR
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [oracleLendContract, signer, fetchContractData])

  /**
   * Withdraw ETH collateral from the lending protocol
   */
  const withdrawCollateral = useCallback(async (amount: string) => {
    if (!oracleLendContract || !signer) {
      throw new Error('Contract not initialized')
    }

    setIsLoading(true)
    setError(null)

    try {
      const value = ethers.parseEther(amount)
      const tx = await oracleLendContract.withdrawCollateral(value)
      
      // Production: Remove console statement
      
      const receipt = await tx.wait()
      // Production: Remove console statement

      // Refresh data
      await fetchContractData()

      return {
        success: true,
        txHash: tx.hash,
        message: SUCCESS_MESSAGES.COLLATERAL_WITHDRAWN
      }
    } catch (err: any) {
      // Production: Remove console statement
      const errorMsg = err.reason || err.message || ERROR_MESSAGES.UNKNOWN_ERROR
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [oracleLendContract, signer, fetchContractData])

  /**
   * Borrow ORACLE tokens against ETH collateral
   */
  const borrowOracle = useCallback(async (amount: string) => {
    if (!oracleLendContract || !signer) {
      throw new Error('Contract not initialized')
    }

    setIsLoading(true)
    setError(null)

    try {
      const value = ethers.parseEther(amount)
      const tx = await oracleLendContract.borrowOracle(value)
      
      // Production: Remove console statement
      
      const receipt = await tx.wait()
      // Production: Remove console statement

      // Refresh data
      await fetchContractData()

      return {
        success: true,
        txHash: tx.hash,
        message: SUCCESS_MESSAGES.BORROW_SUCCESS
      }
    } catch (err: any) {
      // Production: Remove console statement
      const errorMsg = err.reason || err.message || ERROR_MESSAGES.UNKNOWN_ERROR
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [oracleLendContract, signer, fetchContractData])

  /**
   * Repay ORACLE token debt
   */
  const repayOracle = useCallback(async (amount: string) => {
    if (!oracleLendContract || !oracleTokenContract || !signer) {
      throw new Error('Contract not initialized')
    }

    setIsLoading(true)
    setError(null)

    try {
      const value = ethers.parseEther(amount)
      
      // First check allowance
      const allowance = await oracleTokenContract.allowance(userAddress, INTUITION_TESTNET.contracts.oracleLend)
      
      if (allowance < value) {
        // Production: Remove console statement
        const approveTx = await oracleTokenContract.approve(INTUITION_TESTNET.contracts.oracleLend, value)
        await approveTx.wait()
        // Production: Remove console statement
      }

      // Now repay
      const tx = await oracleLendContract.repayOracle(value)
      
      // Production: Remove console statement
      
      const receipt = await tx.wait()
      // Production: Remove console statement

      // Refresh data
      await fetchContractData()
        
        return {
        success: true,
        txHash: tx.hash,
        message: SUCCESS_MESSAGES.REPAY_SUCCESS
      }
    } catch (err: any) {
      // Production: Remove console statement
      const errorMsg = err.reason || err.message || ERROR_MESSAGES.UNKNOWN_ERROR
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [oracleLendContract, oracleTokenContract, signer, userAddress, fetchContractData])

  /**
   * Liquidate an unsafe position
   */
  const liquidate = useCallback(async (userAddress: string) => {
    if (!oracleLendContract || !oracleTokenContract || !signer) {
      throw new Error('Contract not initialized')
    }

    setIsLoading(true)
    setError(null)

    try {
      const liquidatorAddress = await signer.getAddress()
      
      // First check if position is liquidatable
      const isLiquidatable = await oracleLendContract.isLiquidatable(userAddress)
      if (!isLiquidatable) {
        throw new Error('Position is not liquidatable - health ratio is above 120%')
      }

      // Get user debt to determine required ORACLE amount
      const userDebt = await oracleLendContract.userBorrowed(userAddress)
      const liquidatorBalance = await oracleTokenContract.balanceOf(liquidatorAddress)
      
      // Production: Remove console statement
      
      // Production: Remove console statement
      // Production: Remove console statement
      
      // Check if liquidator has enough ORACLE tokens
      if (liquidatorBalance < userDebt) {
        const shortage = userDebt - liquidatorBalance
        throw new Error(`Insufficient ORACLE tokens for liquidation. You need ${ethers.formatEther(userDebt)} ORACLE but only have ${ethers.formatEther(liquidatorBalance)} ORACLE. Missing: ${ethers.formatEther(shortage)} ORACLE`)
      }
      
      // Check and approve if needed
      const allowance = await oracleTokenContract.allowance(liquidatorAddress, INTUITION_TESTNET.contracts.oracleLend)
      
      if (allowance < userDebt) {
        // Production: Remove console statement
        // console.log('Approving ORACLE spending for liquidation...')
        const approveTx = await oracleTokenContract.approve(INTUITION_TESTNET.contracts.oracleLend, userDebt)
        await approveTx.wait()
        // Production: Remove console statement
      }

      // Liquidate
      // Production: Remove console statement
      const tx = await oracleLendContract.liquidate(userAddress)
      
      // Production: Remove console statement
      
      const receipt = await tx.wait()
      // Production: Remove console statement

      // Refresh data
      await fetchContractData()
        
        return {
        success: true,
        txHash: tx.hash,
        message: `${SUCCESS_MESSAGES.LIQUIDATION_SUCCESS} Repaid ${ethers.formatEther(userDebt)} ORACLE debt.`
      }
    } catch (err: any) {
      // Production: Remove console statement
      
      // Provide more specific error messages
      let errorMsg = err.reason || err.message || ERROR_MESSAGES.UNKNOWN_ERROR
      
      if (errorMsg.includes('OracleLend__InsufficientLiquidatorORACLE') || errorMsg.includes('0x7d7654fd')) {
        errorMsg = 'Insufficient ORACLE tokens for liquidation. You need ORACLE tokens equal to the user\'s debt to liquidate their position.'
      } else if (errorMsg.includes('OracleLend__NotLiquidatable') || errorMsg.includes('0x98e9cff3')) {
        errorMsg = 'Position cannot be liquidated - health ratio is above 120% (position is safe)'
      } else if (errorMsg.includes('OracleLend__PositionSafe') || errorMsg.includes('0x591022fe')) {
        errorMsg = 'Position is safe and cannot be liquidated'
      }
      
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [oracleLendContract, oracleTokenContract, signer, fetchContractData])

  // Legacy functions for backwards compatibility
  const supply = useCallback(async (token: string, amount: string) => {
    if (token === 'tTRUST') {
      return addCollateral(amount)
    }
    return { success: false, error: 'Only ETH collateral is supported in the new protocol' }
  }, [addCollateral])

  const withdraw = useCallback(async (token: string, amount: string) => {
    if (token === 'tTRUST') {
      return withdrawCollateral(amount)
    }
    return { success: false, error: 'Only ETH collateral withdrawal is supported' }
  }, [withdrawCollateral])

  const borrow = useCallback(async (token: string, amount: string) => {
    if (token === 'ORACLE') {
      return borrowOracle(amount)
    }
    return { success: false, error: 'Only ORACLE token borrowing is supported' }
  }, [borrowOracle])

  const repay = useCallback(async (token: string, amount: string) => {
    if (token === 'ORACLE') {
      return repayOracle(amount)
    }
    return { success: false, error: 'Only ORACLE token repayment is supported' }
  }, [repayOracle])

  // Swap function (DEX interaction)
  const swap = useCallback(async (fromToken: string, toToken: string, amount: string) => {
    if (!dexContract || !signer) {
      throw new Error('DEX contract not initialized')
    }

    setIsLoading(true)
    setError(null)

    try {
      let tx
      if (fromToken === 'tTRUST' && toToken === 'ORACLE') {
        const value = ethers.parseEther(amount)
        tx = await dexContract.swapTrustForOracle(0, 0, { value }) // 0 minAmountOut for now
      } else if (fromToken === 'ORACLE' && toToken === 'tTRUST') {
        const value = ethers.parseEther(amount)
        
        // Approve DEX to spend ORACLE
        const allowance = await oracleTokenContract!.allowance(userAddress, INTUITION_TESTNET.contracts.dex)
        if (allowance < value) {
          const approveTx = await oracleTokenContract!.approve(INTUITION_TESTNET.contracts.dex, value)
          await approveTx.wait()
        }
        
        tx = await dexContract.swapOracleForTrust(value, 0) // 0 minAmountOut for now
      } else {
        throw new Error('Unsupported swap pair')
      }

      // Production: Remove console statement

      const receipt = await tx.wait()
      // Production: Remove console statement

      // Refresh data
      await fetchContractData()

        return { 
          success: true, 
        txHash: tx.hash,
        message: SUCCESS_MESSAGES.SWAP_SUCCESS
      }
    } catch (err: any) {
      // Production: Remove console statement
      const errorMsg = err.reason || err.message || ERROR_MESSAGES.UNKNOWN_ERROR
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [dexContract, oracleTokenContract, signer, userAddress, fetchContractData])

  /**
   * Mint ORACLE tokens (only for minters)
   */
  const mintOracle = useCallback(async (amount: string) => {
    if (!oracleTokenContract || !signer) {
      throw new Error('Contract not initialized')
    }

    setIsLoading(true)
    setError(null)

    try {
      const userAddress = await signer.getAddress()
      
      // Check if user is a minter
      const isMinter = await oracleTokenContract.isMinter(userAddress)
      if (!isMinter) {
        throw new Error('You are not authorized to mint ORACLE tokens')
      }

      const mintAmount = ethers.parseEther(amount)
      // Production: Remove console statement
      
      const tx = await oracleTokenContract.mint(userAddress, mintAmount)
      
      // Production: Remove console statement
      
      const receipt = await tx.wait()
      // Production: Remove console statement

      // Refresh data
      await fetchContractData()

      return {
        success: true,
        txHash: tx.hash,
        message: `Successfully minted ${amount} ORACLE tokens`
      }
    } catch (err: any) {
      // Production: Remove console statement
      const errorMsg = err.reason || err.message || ERROR_MESSAGES.UNKNOWN_ERROR
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [oracleTokenContract, signer, fetchContractData])

  // Initialize on mount and when wallet connects
  useEffect(() => {
    initializeWeb3()
  }, [initializeWeb3])

  // Fetch data when contracts are ready
  useEffect(() => {
    if (oracleLendContract && oracleTokenContract && dexContract && userAddress) {
      fetchContractData()
    }
  }, [fetchContractData, oracleLendContract, oracleTokenContract, dexContract, userAddress])

  // Refresh data periodically
  useEffect(() => {
    if (!oracleLendContract || !userAddress) return

    const interval = setInterval(() => {
      fetchContractData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [fetchContractData, oracleLendContract, userAddress])

  return {
    // New lending protocol
    userLendingPosition,
    protocolStats,
    addCollateral,
    withdrawCollateral,
    borrowOracle,
    repayOracle,
    liquidate,
    mintOracle,
    
    // Legacy interface
    userPosition,
    lendingPools,
    exchangeRates,
    supply,
    withdraw,
    borrow,
    repay,
    swap,
    
    // Web3 state
    provider,
    signer,
    userAddress,
    isConnected: !!signer && !!userAddress,
    
    // Common state
    isLoading,
    error,
    setError,
    
    // Contract instances (for analytics)
    oracleTokenContract,
    oracleLendContract,
    dexContract,
    
    // Contract management
    initializeWeb3,
    fetchContractData
  }
}