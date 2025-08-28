export interface WalletState {
  isConnected: boolean
  account: string | null
  chainId: number | null
  balance: string
}

export interface TokenBalance {
  tTRUST: string
  ORACLE: string
  INTUIT: string
}

// New lending protocol types
export interface UserLendingPosition {
  // ETH collateral (in wei)
  collateral: string
  // ORACLE debt (in 18 decimals)
  borrowed: string
  // Collateral value in ORACLE terms
  collateralValue: string
  // Health ratio (percentage)
  healthRatio: number
  // Position status
  status: 'safe' | 'warning' | 'danger' | 'none'
  // Max borrowable amount
  maxBorrow: string
  // Max withdrawable collateral
  maxWithdraw: string
}

export interface LendingProtocolStats {
  // Contract balances
  oracleBalance: string // Available ORACLE for borrowing
  ethBalance: string // Total ETH collateral
  // Current price from DEX
  currentPrice: string // ORACLE per 1 ETH
  // Protocol totals
  totalCollateral: string
  totalBorrowed: string
  utilizationRate: number
}

// Legacy types (for backwards compatibility)
export interface LendingPool {
  token: 'tTRUST' | 'ORACLE' | 'INTUIT'
  totalSupply: string
  totalBorrow: string
  supplyAPY: number
  borrowAPY: number
  utilizationRate: number
}

export interface UserPosition {
  supplied: TokenBalance
  borrowed: TokenBalance
  collateralValue: string
  borrowPower: string
  healthFactor: number
}

export interface AnalyticsData {
  totalTransactions: number
  uniqueWallets: number
  totalTVL: {
    tTRUST: string
    ORACLE: string
    INTUIT: string
    usd: string
  }
  volume24h: string
  totalBorrowed: string
  dailySwaps: number
  swapVolume24h: string
  totalSwaps: number
  avgTradeSize: string
  activeLenders: number
  activeBorrowers: number
  newUsers24h: number
  activeUsers24h: number
  chartData: Array<{ timestamp: number; value: string }>
  recentTransactions: Array<{
    type: 'addCollateral' | 'withdrawCollateral' | 'borrowOracle' | 'repayOracle' | 'liquidate' | 'swap' | 'supply' | 'withdraw' | 'borrow' | 'repay'
    user: string
    amount: string
    time: string
    icon: string
    color: string
    txHash: string
  }>
  timestamp: number
}

export interface SwapQuote {
  inputAmount: string
  outputAmount: string
  priceImpact: number
  minimumReceived: string
  exchangeRate: number
}

export interface Transaction {
  hash: string
  type: 'addCollateral' | 'withdrawCollateral' | 'borrowOracle' | 'repayOracle' | 'liquidate' | 'swap' | 'supply' | 'borrow' | 'withdraw' | 'repay'
  amount: string
  token: string
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}
