import { ethers } from 'ethers'
import { INTUITION_TESTNET } from './constants'

// Contract ABIs (simplified for essential functions)
const ORACLE_LEND_ABI = [
  'function supply(address token, uint256 amount) external',
  'function withdraw(address token, uint256 amount) external',
  'function borrow(address token, uint256 amount) external',
  'function repay(address token, uint256 amount) external',
  'function getUserAccount(address user, address token) external view returns (uint256 supplied, uint256 borrowed)',
  'function getBorrowPower(address user) external view returns (uint256)',
  'function getTotalBorrowValue(address user) external view returns (uint256)',
  'function getHealthFactor(address user) external view returns (uint256)',
  'function markets(address token) external view returns (address token, uint256 totalSupply, uint256 totalBorrow, uint256 supplyRate, uint256 borrowRate, uint256 collateralFactor, uint256 liquidationThreshold, bool isActive)',
  'function getAllMarkets() external view returns (address[])',
  'event Supply(address indexed user, address indexed token, uint256 amount)',
  'event Withdraw(address indexed user, address indexed token, uint256 amount)',
  'event Borrow(address indexed user, address indexed token, uint256 amount)',
  'event Repay(address indexed user, address indexed token, uint256 amount)'
]

const ORACLE_TOKEN_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function mint(address to, uint256 amount) external',
  'function burn(uint256 amount) external',
  'function getTokenInfo() external view returns (string name, string symbol, uint8 decimals, uint256 totalSupply, uint256 maxSupply, uint256 initialSupply)'
]

const DEX_ABI = [
  'function swapTrustForOracle(uint256 amountIn, uint256 minAmountOut) external',
  'function swapOracleForTrust(uint256 amountIn, uint256 minAmountOut) external',
  'function getSwapAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut, uint256 fee, uint256 priceImpact)',
  'function getExchangeRate(address tokenIn, uint256 amountIn) external view returns (uint256 rate)',
  'function getDEXStats() external view returns (uint256 tTrustReserve, uint256 oracleReserve, uint256 totalVolume, uint256 totalTrades, uint256 feesCollected)',
  'function getTradingLimits() external view returns (uint256 min, uint256 max)',
  'function isTradeValid(address tokenIn, uint256 amountIn) external view returns (bool)',
  'event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee, uint256 priceImpact)'
]

const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)'
]

export interface Web3Instance {
  provider: ethers.providers.Web3Provider
  signer: ethers.Signer
  contracts: {
    oracleLend: ethers.Contract
    oracleToken: ethers.Contract
    tTrustToken: ethers.Contract
    dex: ethers.Contract
  }
}

export class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null
  private signer: ethers.Signer | null = null
  private contracts: any = {}

  /**
   * Initialize Web3 connection
   */
  async initialize(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    this.provider = new ethers.providers.Web3Provider(window.ethereum)
    this.signer = this.provider.getSigner()

    // Initialize contracts
    await this.initializeContracts()
  }

  /**
   * Initialize contract instances
   */
  private async initializeContracts(): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer not available')
    }

    this.contracts = {
      oracleLend: new ethers.Contract(INTUITION_TESTNET.contracts.oracleLend, ORACLE_LEND_ABI, this.signer),
      oracleToken: new ethers.Contract(INTUITION_TESTNET.contracts.oracleToken, ORACLE_TOKEN_ABI, this.signer),
      tTrustToken: new ethers.Contract(INTUITION_TESTNET.contracts.tTrustToken, ERC20_ABI, this.signer),
      dex: new ethers.Contract(INTUITION_TESTNET.contracts.dex, DEX_ABI, this.signer)
    }
  }

  /**
   * Get current network information
   */
  async getNetwork(): Promise<ethers.providers.Network> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }
    return await this.provider.getNetwork()
  }

  /**
   * Get account balance (native token)
   */
  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }
    const balance = await this.provider.getBalance(address)
    return ethers.utils.formatEther(balance)
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
    const balance = await tokenContract.balanceOf(userAddress)
    const decimals = await tokenContract.decimals()
    return ethers.utils.formatUnits(balance, decimals)
  }

  /**
   * Get token allowance
   */
  async getTokenAllowance(tokenAddress: string, owner: string, spender: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
    const allowance = await tokenContract.allowance(owner, spender)
    const decimals = await tokenContract.decimals()
    return ethers.utils.formatUnits(allowance, decimals)
  }

  /**
   * Approve token spending
   */
  async approveToken(tokenAddress: string, spender: string, amount: string): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error('Signer not available')
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer)
    const decimals = await tokenContract.decimals()
    const parsedAmount = ethers.utils.parseUnits(amount, decimals)
    
    return await tokenContract.approve(spender, parsedAmount)
  }

  /**
   * Supply tokens to lending pool
   */
  async supply(tokenAddress: string, amount: string): Promise<ethers.ContractTransaction> {
    if (!this.contracts.oracleLend) {
      throw new Error('OracleLend contract not initialized')
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer)
    const decimals = await tokenContract.decimals()
    const parsedAmount = ethers.utils.parseUnits(amount, decimals)
    
    return await this.contracts.oracleLend.supply(tokenAddress, parsedAmount)
  }

  /**
   * Withdraw tokens from lending pool
   */
  async withdraw(tokenAddress: string, amount: string): Promise<ethers.ContractTransaction> {
    if (!this.contracts.oracleLend) {
      throw new Error('OracleLend contract not initialized')
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer)
    const decimals = await tokenContract.decimals()
    const parsedAmount = ethers.utils.parseUnits(amount, decimals)
    
    return await this.contracts.oracleLend.withdraw(tokenAddress, parsedAmount)
  }

  /**
   * Borrow tokens from lending pool
   */
  async borrow(tokenAddress: string, amount: string): Promise<ethers.ContractTransaction> {
    if (!this.contracts.oracleLend) {
      throw new Error('OracleLend contract not initialized')
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer)
    const decimals = await tokenContract.decimals()
    const parsedAmount = ethers.utils.parseUnits(amount, decimals)
    
    return await this.contracts.oracleLend.borrow(tokenAddress, parsedAmount)
  }

  /**
   * Repay borrowed tokens
   */
  async repay(tokenAddress: string, amount: string): Promise<ethers.ContractTransaction> {
    if (!this.contracts.oracleLend) {
      throw new Error('OracleLend contract not initialized')
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer)
    const decimals = await tokenContract.decimals()
    const parsedAmount = ethers.utils.parseUnits(amount, decimals)
    
    return await this.contracts.oracleLend.repay(tokenAddress, parsedAmount)
  }

  /**
   * Swap tTRUST for ORACLE
   */
  async swapTrustForOracle(amountIn: string, minAmountOut: string): Promise<ethers.ContractTransaction> {
    if (!this.contracts.dex) {
      throw new Error('DEX contract not initialized')
    }

    const parsedAmountIn = ethers.utils.parseEther(amountIn)
    const parsedMinAmountOut = ethers.utils.parseEther(minAmountOut)
    
    return await this.contracts.dex.swapTrustForOracle(parsedAmountIn, parsedMinAmountOut)
  }

  /**
   * Swap ORACLE for tTRUST
   */
  async swapOracleForTrust(amountIn: string, minAmountOut: string): Promise<ethers.ContractTransaction> {
    if (!this.contracts.dex) {
      throw new Error('DEX contract not initialized')
    }

    const parsedAmountIn = ethers.utils.parseEther(amountIn)
    const parsedMinAmountOut = ethers.utils.parseEther(minAmountOut)
    
    return await this.contracts.dex.swapOracleForTrust(parsedAmountIn, parsedMinAmountOut)
  }

  /**
   * Get swap quote
   */
  async getSwapQuote(tokenIn: string, amountIn: string): Promise<{
    amountOut: string
    fee: string
    priceImpact: number
  }> {
    if (!this.contracts.dex) {
      throw new Error('DEX contract not initialized')
    }

    const parsedAmountIn = ethers.utils.parseEther(amountIn)
    const [amountOut, fee, priceImpact] = await this.contracts.dex.getSwapAmountOut(tokenIn, parsedAmountIn)
    
    return {
      amountOut: ethers.utils.formatEther(amountOut),
      fee: ethers.utils.formatEther(fee),
      priceImpact: priceImpact.toNumber() / 100 // Convert from basis points to percentage
    }
  }

  /**
   * Get user lending position
   */
  async getUserPosition(userAddress: string): Promise<{
    supplied: { tTRUST: string; ORACLE: string }
    borrowed: { tTRUST: string; ORACLE: string }
    borrowPower: string
    healthFactor: string
  }> {
    if (!this.contracts.oracleLend) {
      throw new Error('OracleLend contract not initialized')
    }

    const [tTrustSupplied, tTrustBorrowed] = await this.contracts.oracleLend.getUserAccount(
      userAddress,
      INTUITION_TESTNET.contracts.tTrustToken
    )
    
    const [oracleSupplied, oracleBorrowed] = await this.contracts.oracleLend.getUserAccount(
      userAddress,
      INTUITION_TESTNET.contracts.oracleToken
    )

    const borrowPower = await this.contracts.oracleLend.getBorrowPower(userAddress)
    const healthFactor = await this.contracts.oracleLend.getHealthFactor(userAddress)

    return {
      supplied: {
        tTRUST: ethers.utils.formatEther(tTrustSupplied),
        ORACLE: ethers.utils.formatEther(oracleSupplied)
      },
      borrowed: {
        tTRUST: ethers.utils.formatEther(tTrustBorrowed),
        ORACLE: ethers.utils.formatEther(oracleBorrowed)
      },
      borrowPower: ethers.utils.formatEther(borrowPower),
      healthFactor: ethers.utils.formatEther(healthFactor)
    }
  }

  /**
   * Get lending markets information
   */
  async getLendingMarkets(): Promise<Array<{
    token: string
    totalSupply: string
    totalBorrow: string
    supplyRate: number
    borrowRate: number
    utilizationRate: number
  }>> {
    if (!this.contracts.oracleLend) {
      throw new Error('OracleLend contract not initialized')
    }

    const markets = await this.contracts.oracleLend.getAllMarkets()
    const marketData = []

    for (const marketAddress of markets) {
      const market = await this.contracts.oracleLend.markets(marketAddress)
      const utilizationRate = market.totalSupply > 0 
        ? (market.totalBorrow * 100) / market.totalSupply 
        : 0

      marketData.push({
        token: marketAddress,
        totalSupply: ethers.utils.formatEther(market.totalSupply),
        totalBorrow: ethers.utils.formatEther(market.totalBorrow),
        supplyRate: market.supplyRate / 100, // Convert from basis points
        borrowRate: market.borrowRate / 100,
        utilizationRate: Math.round(utilizationRate * 100) / 100
      })
    }

    return marketData
  }

  /**
   * Get DEX statistics
   */
  async getDEXStats(): Promise<{
    tTrustReserve: string
    oracleReserve: string
    totalVolume: string
    totalTrades: number
    feesCollected: string
  }> {
    if (!this.contracts.dex) {
      throw new Error('DEX contract not initialized')
    }

    const [tTrustReserve, oracleReserve, totalVolume, totalTrades, feesCollected] = 
      await this.contracts.dex.getDEXStats()

    return {
      tTrustReserve: ethers.utils.formatEther(tTrustReserve),
      oracleReserve: ethers.utils.formatEther(oracleReserve),
      totalVolume: ethers.utils.formatEther(totalVolume),
      totalTrades: totalTrades.toNumber(),
      feesCollected: ethers.utils.formatEther(feesCollected)
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<ethers.ContractReceipt> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }
    return await this.provider.waitForTransaction(txHash, confirmations)
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed'
    blockNumber?: number
    gasUsed?: string
  }> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    const tx = await this.provider.getTransaction(txHash)
    if (!tx) {
      throw new Error('Transaction not found')
    }

    const receipt = await this.provider.getTransactionReceipt(txHash)
    
    if (!receipt) {
      return { status: 'pending' }
    }

    return {
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    }
  }

  /**
   * Format error message from contract interaction
   */
  formatError(error: any): string {
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return 'Transaction will likely fail. Please check your inputs and try again.'
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return 'Insufficient funds to complete this transaction.'
    }

    if (error.message?.includes('user rejected')) {
      return 'Transaction was rejected by user.'
    }

    if (error.reason) {
      return error.reason
    }

    if (error.message) {
      return error.message
    }

    return 'An unknown error occurred. Please try again.'
  }

  /**
   * Get contract instances
   */
  getContracts() {
    return this.contracts
  }

  /**
   * Get provider instance
   */
  getProvider() {
    return this.provider
  }

  /**
   * Get signer instance
   */
  getSigner() {
    return this.signer
  }
}

// Export singleton instance
export const web3Service = new Web3Service()

// Utility functions
export const formatTokenAmount = (amount: string, decimals: number = 18): string => {
  return ethers.utils.formatUnits(amount, decimals)
}

export const parseTokenAmount = (amount: string, decimals: number = 18): ethers.BigNumber => {
  return ethers.utils.parseUnits(amount, decimals)
}

export const isAddress = (address: string): boolean => {
  return ethers.utils.isAddress(address)
}

export const shortenAddress = (address: string, chars: number = 4): string => {
  if (!isAddress(address)) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}
